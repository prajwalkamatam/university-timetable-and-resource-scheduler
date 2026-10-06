package zdcf;

public class CustomHashMap<K, V> {
    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> next;

        Node(K key, V value) {
            this.key = key;
            this.value = value;
            this.next = null;
        }
    }

    private Node<K, V>[] buckets;
    private int capacity;
    private int size;

    @SuppressWarnings("unchecked")
    public CustomHashMap(int capacity) {
        this.capacity = capacity;
        this.buckets = new Node[capacity];
        this.size = 0;
    }

    public CustomHashMap() {
        this(16);
    }

    // Polynomial rolling hash for strings, otherwise default hashCode
    private int hash(K key) {
        if (key instanceof String) {
            String s = (String) key;
            long hashValue = 0;
            long p = 31;
            long m = 1000000009;
            long p_pow = 1;
            for (int i = 0; i < s.length(); i++) {
                hashValue = (hashValue + (s.charAt(i) - 'a' + 1) * p_pow) % m;
                p_pow = (p_pow * p) % m;
            }
            return Math.abs((int) hashValue % capacity);
        }
        return Math.abs(key.hashCode() % capacity);
    }

    public void put(K key, V value) {
        int index = hash(key);
        Node<K, V> head = buckets[index];

        // Check if key already exists, update value
        Node<K, V> current = head;
        while (current != null) {
            if (current.key.equals(key)) {
                current.value = value;
                return;
            }
            current = current.next;
        }

        // Insert new node at head
        Node<K, V> newNode = new Node<>(key, value);
        newNode.next = head;
        buckets[index] = newNode;
        size++;

        // Load factor check and resize
        if ((1.0 * size) / capacity > 0.75) {
            resize();
        }
    }

    public V get(K key) {
        int index = hash(key);
        Node<K, V> current = buckets[index];
        while (current != null) {
            if (current.key.equals(key)) {
                return current.value;
            }
            current = current.next;
        }
        return null;
    }

    public boolean containsKey(K key) {
        return get(key) != null;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        capacity *= 2;
        Node<K, V>[] oldBuckets = buckets;
        buckets = new Node[capacity];
        size = 0;

        for (Node<K, V> headNode : oldBuckets) {
            while (headNode != null) {
                put(headNode.key, headNode.value);
                headNode = headNode.next;
            }
        }
    }

    public int size() {
        return size;
    }

    public CustomDynamicArray<K> keys() {
        CustomDynamicArray<K> keyList = new CustomDynamicArray<>();
        for (Node<K, V> headNode : buckets) {
            while (headNode != null) {
                keyList.add(headNode.key);
                headNode = headNode.next;
            }
        }
        return keyList;
    }
}
