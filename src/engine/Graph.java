package engine;

import zdcf.CustomDynamicArray;
import zdcf.CustomHashMap;

public class Graph {
    public static class Edge {
        public int to;
        public int capacity;
        public int flow;
        public Edge reverse;

        public Edge(int to, int capacity) {
            this.to = to;
            this.capacity = capacity;
            this.flow = 0;
        }
    }

    private CustomHashMap<Integer, CustomDynamicArray<Edge>> adj;

    public Graph() {
        adj = new CustomHashMap<>();
    }

    public void addNode(int u) {
        if (!adj.containsKey(u)) {
            adj.put(u, new CustomDynamicArray<>());
        }
    }

    public void addEdge(int from, int to, int capacity) {
        addNode(from);
        addNode(to);
        
        Edge e1 = new Edge(to, capacity);
        Edge e2 = new Edge(from, 0); // Reverse edge has 0 initial capacity
        e1.reverse = e2;
        e2.reverse = e1;
        
        adj.get(from).add(e1);
        adj.get(to).add(e2);
    }

    public CustomDynamicArray<Edge> getEdges(int u) {
        if (adj.containsKey(u)) {
            return adj.get(u);
        }
        return new CustomDynamicArray<>();
    }

    public CustomDynamicArray<Integer> getNodes() {
        return adj.keys();
    }
}
