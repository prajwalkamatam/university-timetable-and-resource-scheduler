package models;

public class ScheduledClass {
    private Professor professor;
    private Course course;
    private Room room;
    private int timeslot;

    public ScheduledClass(Professor professor, Course course, Room room) {
        this.professor = professor;
        this.course = course;
        this.room = room;
        this.timeslot = -1; // Unassigned
    }

    public Professor getProfessor() { return professor; }
    public Course getCourse() { return course; }
    public Room getRoom() { return room; }
    public int getTimeslot() { return timeslot; }
    
    public void setRoom(Room room) { this.room = room; }
    public void setTimeslot(int timeslot) { this.timeslot = timeslot; }
}
