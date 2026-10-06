import io.CSVDataExporter;
import io.CSVLexer;
import models.Course;
import models.Professor;
import models.Room;
import models.ScheduledClass;
import engine.Graph;
import engine.NetworkFlow;
import engine.GraphColoring;
import zdcf.CustomDynamicArray;

public class Main {
    public static void main(String[] args) {
        long seed = 1; // Default seed (Week 1)
        if (args.length > 0) {
            try {
                seed = Long.parseLong(args[0]);
            } catch (NumberFormatException e) {
                System.out.println("Invalid week number provided, using default Week 1.");
            }
        }
        
        System.out.println("Initializing Zero-Dependency Timetable Scheduler for Week " + seed + "...");
        
        CSVLexer lexer = new CSVLexer();
        CustomDynamicArray<Professor> professors = lexer.loadProfessors("data/professors.csv");
        CustomDynamicArray<Course> courses = lexer.loadCourses("data/courses.csv");
        CustomDynamicArray<Room> rooms = lexer.loadRooms("data/rooms.csv");
        
        // Shuffle the parsed data arrays to introduce schedule variation
        zdcf.CustomRandom random = new zdcf.CustomRandom(seed);
        professors.shuffle(random);
        courses.shuffle(random);
        rooms.shuffle(random);
        
        System.out.println("Loaded " + professors.size() + " professors, " + 
                           courses.size() + " courses, " + rooms.size() + " rooms.");
                           
        System.out.println("Building Bipartite Graph...");
        Graph flowGraph = new Graph();
        int source = 0;
        int sink = 1;
        
        // Node offsets to ensure uniqueness
        int profOffset = 1000;
        int courseOffset = 10000;
        
        // Pass 1: Give every professor exactly 1 class initially
        for (int i = 0; i < professors.size(); i++) {
            Professor p = professors.get(i);
            flowGraph.addEdge(source, p.getId() + profOffset, 1);
        }
        
        // Edges from professors to courses (capacity = 1) ONLY if Subject matches
        for (int i = 0; i < professors.size(); i++) {
            Professor p = professors.get(i);
            for (int j = 0; j < courses.size(); j++) {
                Course c = courses.get(j);
                if (p.getSubject().equals(c.getSubject())) {
                    flowGraph.addEdge(p.getId() + profOffset, c.getId() + courseOffset, 1);
                }
            }
        }
        
        // Edges from courses to sink (capacity = 1)
        for (int i = 0; i < courses.size(); i++) {
            Course c = courses.get(i);
            flowGraph.addEdge(c.getId() + courseOffset, sink, 1);
        }
        
        System.out.println("Pushing Initial Load-Balancing Flow (1 class per prof)...");
        NetworkFlow maxFlowAlgo = new NetworkFlow(flowGraph, source, sink);
        int flow1 = maxFlowAlgo.pushFlow();
        System.out.println("Pass 1 Assignments: " + flow1);
        
        // Pass 2: Dynamically increase Source->Prof edges up to MaxClasses
        for (int i = 0; i < professors.size(); i++) {
            Professor p = professors.get(i);
            CustomDynamicArray<Graph.Edge> edges = flowGraph.getEdges(source);
            for (int e = 0; e < edges.size(); e++) {
                Graph.Edge edge = edges.get(e);
                if (edge.to == p.getId() + profOffset) {
                    edge.capacity = p.getMaxClasses(); // Raise capacity to max
                    break;
                }
            }
        }
        
        System.out.println("Pushing Remaining Flow up to MaxCapacity...");
        int flow2 = maxFlowAlgo.pushFlow();
        System.out.println("Pass 2 Assignments: " + flow2);
        System.out.println("Total Classes Scheduled: " + (flow1 + flow2));
        
        // Extract assignments
        CustomDynamicArray<ScheduledClass> assignedClasses = new CustomDynamicArray<>();
        for (int i = 0; i < professors.size(); i++) {
            Professor p = professors.get(i);
            CustomDynamicArray<Graph.Edge> edges = flowGraph.getEdges(p.getId() + profOffset);
            for (int e = 0; e < edges.size(); e++) {
                Graph.Edge edge = edges.get(e);
                if (edge.to != source && edge.flow > 0) { // If flow pushed to course
                    Course assignedCourse = null;
                    for (int k = 0; k < courses.size(); k++) {
                        if (courses.get(k).getId() + courseOffset == edge.to) {
                            assignedCourse = courses.get(k);
                            break;
                        }
                    }
                    if (assignedCourse != null) {
                        assignedClasses.add(new ScheduledClass(p, assignedCourse, null));
                    }
                }
            }
        }
        
        System.out.println("Running Advanced Graph Coloring & Resource Allocation...");
        GraphColoring coloring = new GraphColoring();
        coloring.assignTimeslots(assignedClasses, rooms);
        System.out.println("Conflicts resolved and constraints optimized.");
        
        CSVDataExporter exporter = new CSVDataExporter();
        exporter.exportSchedule(assignedClasses, "data/schedule.csv");
    }
}
