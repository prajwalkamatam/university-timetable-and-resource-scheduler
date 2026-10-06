package zdcf;

public class CustomRandom {
    // Linear Congruential Generator parameters (commonly used in glibc)
    private long state;
    private static final long a = 1103515245L;
    private static final long c = 12345L;
    private static final long m = 2147483648L; // 2^31

    public CustomRandom(long seed) {
        this.state = seed;
    }

    // Returns a random integer between 0 (inclusive) and bound (exclusive)
    public int nextInt(int bound) {
        state = (a * state + c) % m;
        return (int) Math.abs(state % bound);
    }
}
