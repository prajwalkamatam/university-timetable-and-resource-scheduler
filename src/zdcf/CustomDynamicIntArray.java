package zdcf;

/**
 * A specialized dynamic array that uses primitive 'int' rather than Objects.
 * This proves the "Gap Finding" point: avoiding the memory bloat of auto-boxing
 * 'Integer' objects found in java.util.ArrayList<Integer>.
 */
public class CustomDynamicIntArray {
    private int[] array;
    private int size;
    private int capacity;

    public CustomDynamicIntArray(int capacity) {
        this.capacity = capacity;
        this.array = new int[capacity];
        this.size = 0;
    }

    public CustomDynamicIntArray() {
        this(10);
    }

    public void add(int element) {
        if (size == capacity) {
            resize();
        }
        array[size++] = element;
    }

    public int get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        return array[index];
    }

    public int size() {
        return size;
    }

    private void resize() {
        capacity *= 2;
        int[] newArray = new int[capacity];
        for (int i = 0; i < size; i++) {
            newArray[i] = array[i];
        }
        array = newArray;
    }
}
