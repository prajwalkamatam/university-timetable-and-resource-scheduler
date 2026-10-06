package engine;

import zdcf.CustomQueue;
import zdcf.CustomHashMap;
import zdcf.CustomDynamicArray;

public class NetworkFlow {
    private Graph graph;
    private int source;
    private int sink;

    public NetworkFlow(Graph graph, int source, int sink) {
        this.graph = graph;
        this.source = source;
        this.sink = sink;
    }

    public int pushFlow() {
        int maxFlow = 0;
        while (true) {
            CustomHashMap<Integer, Graph.Edge> parentEdge = new CustomHashMap<>();
            CustomQueue<Integer> queue = new CustomQueue<>();
            
            queue.enqueue(source);
            boolean reachedSink = false;
            
            // BFS to find augmenting path
            while (!queue.isEmpty() && !reachedSink) {
                int curr = queue.dequeue();
                CustomDynamicArray<Graph.Edge> edges = graph.getEdges(curr);
                
                for (int i = 0; i < edges.size(); i++) {
                    Graph.Edge edge = edges.get(i);
                    int remainingCapacity = edge.capacity - edge.flow;
                    
                    if (remainingCapacity > 0 && !parentEdge.containsKey(edge.to) && edge.to != source) {
                        parentEdge.put(edge.to, edge);
                        queue.enqueue(edge.to);
                        if (edge.to == sink) {
                            reachedSink = true;
                            break;
                        }
                    }
                }
            }

            if (!reachedSink) {
                break; // No more augmenting paths
            }

            // Find min capacity on the augmenting path
            int push = Integer.MAX_VALUE;
            int curr = sink;
            while (curr != source) {
                Graph.Edge edge = parentEdge.get(curr);
                int remainingCapacity = edge.capacity - edge.flow;
                if (remainingCapacity < push) {
                    push = remainingCapacity;
                }
                curr = edge.reverse.to; // Go to parent
            }

            // Update flows along the path
            curr = sink;
            while (curr != source) {
                Graph.Edge edge = parentEdge.get(curr);
                edge.flow += push;
                edge.reverse.flow -= push;
                curr = edge.reverse.to;
            }

            maxFlow += push;
        }
        return maxFlow;
    }
}
