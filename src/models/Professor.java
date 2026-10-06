package models;

public class Professor {
    private int id;
    private String name;
    private String subject;
    private int maxClasses;
    private int preferredTimeslot; // -1 means no preference

    public Professor(int id, String name, String subject, int maxClasses, int preferredTimeslot) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.maxClasses = maxClasses;
        this.preferredTimeslot = preferredTimeslot;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getSubject() { return subject; }
    public int getMaxClasses() { return maxClasses; }
    public int getPreferredTimeslot() { return preferredTimeslot; }
}
