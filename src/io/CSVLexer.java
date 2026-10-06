package io;

import zdcf.CustomDynamicArray;
import models.Professor;
import models.Course;
import models.Room;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class CSVLexer {

    // Deterministic linear-time lexical parser without String.split
    public String[] split(String line, char delimiter) {
        CustomDynamicArray<String> tokens = new CustomDynamicArray<>();
        StringBuilder currentToken = new StringBuilder();
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == delimiter) {
                tokens.add(currentToken.toString().trim());
                currentToken.setLength(0);
            } else {
                currentToken.append(c);
            }
        }
        tokens.add(currentToken.toString().trim());
        
        String[] result = new String[tokens.size()];
        for (int i = 0; i < tokens.size(); i++) {
            result[i] = tokens.get(i);
        }
        return result;
    }

    public CustomDynamicArray<Professor> loadProfessors(String filePath) {
        CustomDynamicArray<Professor> array = new CustomDynamicArray<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean isHeader = true;
            while ((line = br.readLine()) != null) {
                if (isHeader) { isHeader = false; continue; }
                String[] columns = split(line, ',');
                if (columns.length >= 4) {
                    int id = Integer.parseInt(columns[0]);
                    String name = columns[1];
                    String subject = columns[2];
                    int maxClasses = Integer.parseInt(columns[3]);
                    int preferredTimeslot = -1;
                    if (columns.length >= 5) {
                        try { preferredTimeslot = Integer.parseInt(columns[4]); } catch (Exception e) {}
                    }
                    array.add(new Professor(id, name, subject, maxClasses, preferredTimeslot));
                }
            }
        } catch (IOException e) {
            System.out.println("Error reading professors: " + e.getMessage());
        }
        return array;
    }

    public CustomDynamicArray<Course> loadCourses(String filePath) {
        CustomDynamicArray<Course> array = new CustomDynamicArray<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean isHeader = true;
            while ((line = br.readLine()) != null) {
                if (isHeader) { isHeader = false; continue; }
                String[] columns = split(line, ',');
                if (columns.length >= 4) {
                    int id = Integer.parseInt(columns[0]);
                    String name = columns[1];
                    String subject = columns[2];
                    String cohort = columns[3];
                    int studentCount = 30; // Default capacity assumption
                    if (columns.length >= 5) {
                        try { studentCount = Integer.parseInt(columns[4]); } catch (Exception e) {}
                    }
                    array.add(new Course(id, name, subject, cohort, studentCount));
                }
            }
        } catch (IOException e) {
            System.out.println("Error reading courses: " + e.getMessage());
        }
        return array;
    }

    public CustomDynamicArray<Room> loadRooms(String filePath) {
        CustomDynamicArray<Room> array = new CustomDynamicArray<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean isHeader = true;
            while ((line = br.readLine()) != null) {
                if (isHeader) { isHeader = false; continue; }
                String[] columns = split(line, ',');
                if (columns.length >= 3) {
                    int id = Integer.parseInt(columns[0]);
                    String name = columns[1];
                    int capacity = Integer.parseInt(columns[2]);
                    array.add(new Room(id, name, capacity));
                }
            }
        } catch (IOException e) {
            System.out.println("Error reading rooms: " + e.getMessage());
        }
        return array;
    }
}
