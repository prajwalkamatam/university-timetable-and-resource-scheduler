package models;

public class Course {
    private int id;
    private String name;
    private String subject;
    private String cohort;
    private int studentCount;

    public Course(int id, String name, String subject, String cohort, int studentCount) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.cohort = cohort;
        this.studentCount = studentCount;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getSubject() { return subject; }
    public String getCohort() { return cohort; }
    public int getStudentCount() { return studentCount; }
}
