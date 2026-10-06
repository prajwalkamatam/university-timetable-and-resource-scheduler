package io;

import models.ScheduledClass;
import zdcf.CustomDynamicArray;
import zdcf.CustomHashMap;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

public class CSVDataExporter {
    
    public void exportSchedule(CustomDynamicArray<ScheduledClass> schedule, String baseOutputPath) {
        // Group classes by Cohort
        CustomHashMap<String, CustomDynamicArray<ScheduledClass>> cohortMap = new CustomHashMap<>();
        for (int i = 0; i < schedule.size(); i++) {
            ScheduledClass c = schedule.get(i);
            String cohort = c.getCourse().getCohort();
            if (!cohortMap.containsKey(cohort)) {
                cohortMap.put(cohort, new CustomDynamicArray<>());
            }
            cohortMap.get(cohort).add(c);
        }
        
        // Export a separate CSV for each Cohort
        CustomDynamicArray<String> cohorts = cohortMap.keys();
        for (int i = 0; i < cohorts.size(); i++) {
            String cohort = cohorts.get(i);
            String outputPath = baseOutputPath.replace(".csv", "_" + cohort + ".csv");
            exportSingle(cohortMap.get(cohort), outputPath);
        }
    }

    private void exportSingle(CustomDynamicArray<ScheduledClass> schedule, String outputPath) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(outputPath))) {
            bw.write("Timeslot,Room,Professor,Course");
            bw.newLine();
            
            for (int i = 0; i < schedule.size(); i++) {
                ScheduledClass c = schedule.get(i);
                String roomName = c.getRoom() != null ? c.getRoom().getName() : "TBD";
                bw.write("TS" + c.getTimeslot() + "," + roomName + "," + 
                         c.getProfessor().getName() + "," + c.getCourse().getName());
                bw.newLine();
            }
            
            System.out.println("Success: Schedule exported to " + outputPath);
        } catch (IOException e) {
            System.out.println("Error writing to CSV file: " + e.getMessage());
        }
    }
}
