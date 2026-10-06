package zdcf;

public class CustomDynamicArray<T> {
    private Object[] array;
    private int size;
    private int capacity;

    public CustomDynamicArray() {
        this.capacity = 10;
        this.array = new Object[capacity];
        this.size = 0;
    }

    public CustomDynamicArray(int capacity) {
        this.capacity = capacity;
        this.array = new Object[capacity];
        this.size = 0;
    }

    public void add(T element) {
        if (size == capacity) {
            resize();
        }
        array[size++] = element;
    }

    @SuppressWarnings("unchecked")
    public T get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        return (T) array[index];
    }

    public int size() {
        return size;
    }

    private void resize() {
        capacity *= 2;
        Object[] newArray = new Object[capacity];
        for (int i = 0; i < size; i++) {
            newArray[i] = array[i];
        }
        array = newArray;
    }

    public void set(int index, T element) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
        array[index] = element;
    }

    public void swap(int i, int j) {
        Object temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    public void shuffle(CustomRandom rnd) {
        for (int i = size - 1; i > 0; i--) {
            int j = rnd.nextInt(i + 1);
            swap(i, j);
        }
    }
}
