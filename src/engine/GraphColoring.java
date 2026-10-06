package engine;

import models.Room;
import models.ScheduledClass;
import zdcf.CustomDynamicArray;

public class GraphColoring {
    
    // Advanced Constraint Engine: Room Capacities + Soft Preferences
    public void assignTimeslots(CustomDynamicArray<ScheduledClass> classes, CustomDynamicArray<Room> availableRooms) {
        int n = classes.size();
        
        // Greedily place each class, optimizing for Soft Constraints
        for (int i = 0; i < n; i++) {
            ScheduledClass currentClass = classes.get(i);
            
            int bestTimeslot = -1;
            Room bestRoom = null;
            int maxScore = Integer.MIN_VALUE;
            
            // Search up to 30 timeslots (5 days * 6 slots, for example)
            for (int ts = 1; ts <= 30; ts++) {
                
                for (int r = 0; r < availableRooms.size(); r++) {
                    Room room = availableRooms.get(r);
                    
                    // HARD CONSTRAINT 1: Room Capacity
                    if (room.getCapacity() < currentClass.getCourse().getStudentCount()) {
                        continue;
                    }
                    
                    // Check conflicts with already assigned classes
                    boolean conflict = false;
                    for (int j = 0; j < i; j++) {
                        ScheduledClass other = classes.get(j);
                        if (other.getTimeslot() != ts) continue;
                        
                        // HARD CONSTRAINT 2: Room overlap
                        if (other.getRoom() != null && other.getRoom().getId() == room.getId()) {
                            conflict = true;
                            break;
                        }
                        
                        // HARD CONSTRAINT 3: Professor overlap
                        if (other.getProfessor().getId() == currentClass.getProfessor().getId()) {
                            conflict = true;
                            break;
                        }
                        
                        // HARD CONSTRAINT 4: Cohort overlap
                        if (other.getCourse().getCohort().equals(currentClass.getCourse().getCohort())) {
                            conflict = true;
                            break;
                        }
                    }
                    
                    if (!conflict) {
                        // We found a VALID placement. Now evaluate Soft Constraints.
                        int score = 0;
                        
                        // SOFT CONSTRAINT: Professor time preference
                        if (ts == currentClass.getProfessor().getPreferredTimeslot()) {
                            score += 1000;
                        }
                        
                        // SOFT CONSTRAINT: Room size optimization (minimize wasted seats)
                        int wastedSeats = room.getCapacity() - currentClass.getCourse().getStudentCount();
                        score -= wastedSeats; // Less wasted space = higher score
                        
                        // Prefer earlier timeslots generally if no preference
                        score -= ts;
                        
                        if (score > maxScore) {
                            maxScore = score;
                            bestTimeslot = ts;
                            bestRoom = room;
                        }
                    }
                }
            }
            
            // Assign the best found configuration
            if (bestTimeslot != -1 && bestRoom != null) {
                currentClass.setTimeslot(bestTimeslot);
                currentClass.setRoom(bestRoom);
            } else {
                System.out.println("WARNING: Could not find valid timeslot/room for " + currentClass.getCourse().getName());
            }
        }
    }
}
