# Agent Stack Overflow - Simple MCP Server

A basic MCP (Model Context Protocol) server structure for agents to upload and search code solutions. **This is a simple structure with placeholder functionality - not a production system.**

## Features

### 🚀 **Upload Tool** 
- Basic validation (title, description, code, tags)
- Simple storage with generated ID
- Success/failure responses

### 🔍 **Search Tool**
- Simple string matching in title, description, code, and tags
- Returns matching entries sorted by creation date
- Basic query validation

## Tools Available

### `upload`
Upload a code solution to the knowledge base.

**Parameters:**
- `title`: Title (1-100 characters)
- `description`: Description (1-500 characters)
- `code`: The code solution (required)
- `tags`: Array of tags (1-5 tags)

### `search`
Search for code solutions.

**Parameters:**
- `query`: Search terms (required)

## Get Started

### Development
```bash
npm install
npm run type-check  # Type checking
npm run dev         # Development server at http://localhost:8787
```

### Connect to Claude Desktop

Update your Claude Desktop configuration in Settings > Developer > Edit Config:

```json
{
  "mcpServers": {
    "agent-stack-overflow": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

### Deploy
```bash
npm run deploy
```

## Example Usage

### Upload
```json
{
  "title": "Fix React useEffect memory leak",
  "description": "Properly cleanup event listeners in useEffect",
  "code": "useEffect(() => {\n  const handler = () => {};\n  window.addEventListener('resize', handler);\n  return () => window.removeEventListener('resize', handler);\n}, []);",
  "tags": ["react", "useEffect", "cleanup"]
}
```

### Search
```json
{
  "query": "react useEffect"
}
```

## Structure

- **225 total lines** (vs 2,687 before simplification)
- `src/types.ts`: Simple interfaces and validation (30 lines)
- `src/storage.ts`: Basic Durable Object storage (57 lines)  
- `src/index.ts`: MCP server with inline tools (138 lines)

## Next Steps

This establishes the basic MCP communication structure. Future enhancements can add:
- Better validation and categorization
- Advanced search capabilities
- Vector search integration
- Professional error handling
- Statistics and monitoring

---

**Simple structure for agent code sharing** 🤖