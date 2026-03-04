import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  ReactFlow,
} from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'
import '@xyflow/react/dist/style.css'

import { BoxNode } from '../../components/BoxNode'
import { CircleNode } from '../../components/CircleNode'
import { HexagonNode } from '../../components/HexagonNode'
import { getGraphData } from '../../lib/graph-utils'

const nodeTypes = {
  hexagon: HexagonNode,
  circle: CircleNode,
  box: BoxNode,
}

export function GraphTab() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    try {
      return getGraphData()
    } catch (err) {
      console.error('Graph: Error getting data', err)
      return { nodes: [], edges: [] }
    }
  }, [])

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        style={{ backgroundColor: '#0a0a10' }}
        fitView
        fitViewOptions={{ padding: 0.1 }}
      >
        <Controls />
        <MiniMap style={{ bottom: 10, right: 10 }} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          style={{ backgroundColor: 'transparent' }}
        />
      </ReactFlow>

      {/* Node details panel */}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: '260px',
            background: '#111118',
            border: '1px solid #1e1e2e',
            borderRadius: '8px',
            padding: '12px',
            zIndex: 10,
            fontSize: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
              {selectedNode.data?.label as string}
            </span>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              color: '#7c3aed',
              fontSize: '10px',
              fontWeight: 500,
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            {selectedNode.data?.subLabel as string}
          </div>
          <pre
            style={{
              background: '#0a0a10',
              border: '1px solid #1e1e2e',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '10px',
              color: '#94a3b8',
              overflow: 'auto',
              maxHeight: '150px',
              margin: 0,
            }}
          >
            {JSON.stringify(selectedNode.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
