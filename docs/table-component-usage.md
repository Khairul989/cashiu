# Table Component Usage Guide

The new Table component system provides a flexible and standardized way to create consistent tables across the application. It consists of four main components:

- `Table` - Main table wrapper with standardized header structure
- `TableRow` - Individual table rows with consistent styling
- `TableEmpty` - Empty state display
- `TableLoading` - Loading state display

## Basic Usage

### 1. Simple Table

```vue
<template>
  <Table :headers="headers">
    <template #body="{ headers }">
      <TableRow
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
      />
    </template>
  </Table>
</template>

<script setup lang="ts">
import { Table, TableRow } from '~/components'

const headers = [
  { name: 'Name', value: 'name', sortable: true },
  { name: 'Email', value: 'email' },
  { name: 'Status', value: 'status', align: 'center' },
  { name: 'Created', value: 'created_at', type: 'date' }
]

const items = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', created_at: '2024-01-01' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', created_at: '2024-01-02' }
]
</script>
```

### 2. Table with Selection

```vue
<template>
  <Table 
    :headers="headers" 
    :selectable="true"
    :can-select-all="canSelectAll"
    :select-all="selectAll"
    @select-all-change="handleSelectAllChange"
    @sort="handleSort"
  >
    <template #body="{ headers, selectable }">
      <TableRow
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
        :selectable="selectable"
        :selected="item.selected"
        @select-change="handleItemSelect"
      />
    </template>
  </Table>
</template>

<script setup lang="ts">
import { Table, TableRow } from '~/components'

const headers = [
  { name: 'Name', value: 'name', sortable: true },
  { name: 'Email', value: 'email' },
  { name: 'Status', value: 'status', align: 'center', type: 'boolean' },
  { name: 'Amount', value: 'amount', align: 'right', type: 'currency' }
]

const selectAll = ref(false)
const canSelectAll = ref(true)

const handleSelectAllChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Handle select all logic
}

const handleSort = (header: TableHeader) => {
  // Handle sorting logic
}

const handleItemSelect = (event: Event) => {
  // Handle individual item selection
}
</script>
```

### 3. Table with Actions

```vue
<template>
  <Table 
    :headers="headers" 
    :show-actions="true"
    @sort="handleSort"
  >
    <template #body="{ headers, showActions }">
      <TableRow
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
        :show-actions="showActions"
      >
        <template #actions="{ data }">
          <div class="flex items-center gap-2">
            <Button @click="editItem(data)">Edit</Button>
            <DangerButton @click="deleteItem(data)">Delete</DangerButton>
          </div>
        </template>
      </TableRow>
    </template>
  </Table>
</template>
```

### 4. Table with Custom Cell Content

```vue
<template>
  <Table :headers="headers">
    <template #body="{ headers }">
      <TableRow
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
      >
        <!-- Custom cell for name column -->
        <template #cell-name="{ data }">
          <div class="flex items-center gap-3">
            <img :src="data.avatar" class="w-8 h-8 rounded-full" />
            <span class="font-medium">{{ data.name }}</span>
          </div>
        </template>
        
        <!-- Custom cell for status column -->
        <template #cell-status="{ data }">
          <span :class="getStatusClass(data.status)">
            {{ data.status }}
          </span>
        </template>
      </TableRow>
    </template>
  </Table>
</template>
```

### 5. Table with Empty State

```vue
<template>
  <Table :headers="headers">
    <template #body="{ headers, selectable, showActions }">
      <TableEmpty 
        v-if="items.length === 0"
        :colspan="getColspan(headers, selectable, showActions)"
        title="No sellers found"
        description="Try adjusting your search criteria or filters"
      >
        <template #action>
          <Button @click="refreshData">Refresh</Button>
        </template>
      </TableEmpty>
      
      <TableRow
        v-else
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
        :selectable="selectable"
        :show-actions="showActions"
      />
    </template>
  </Table>
</template>

<script setup lang="ts">
const getColspan = (headers: TableHeader[], selectable: boolean, showActions: boolean) => {
  let colspan = headers.length
  if (selectable) colspan++
  if (showActions) colspan++
  return colspan
}
</script>
```

### 6. Table with Loading State

```vue
<template>
  <Table :headers="headers">
    <template #body="{ headers, selectable, showActions }">
      <TableLoading 
        v-if="loading"
        :headers="headers"
        :selectable="selectable"
        :show-actions="showActions"
        :rows="5"
      />
      
      <TableRow
        v-else
        v-for="item in items"
        :key="item.id"
        :headers="headers"
        :data="item"
        :selectable="selectable"
        :show-actions="showActions"
      />
    </template>
  </Table>
</template>
```

## Header Configuration

The `headers` array defines the structure of your table. Each header object supports the following properties:

```typescript
interface TableHeader {
  name: string           // Display name for the column
  value: string          // Key to access data from the item object
  sortable?: boolean     // Whether the column is sortable
  align?: 'left' | 'center' | 'right'  // Text alignment
  width?: string         // CSS width (e.g., 'w-20', 'w-32')
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'custom'
  format?: string        // Custom format string
}
```

### Header Types

- **text**: Default text display
- **number**: Formatted with locale-specific number formatting
- **date**: Automatically formatted as locale date
- **currency**: Formatted as Malaysian Ringgit (MYR)
- **boolean**: Displays as "Yes" or "No"
- **custom**: Allows custom formatting via slots

## Advanced Features

### Custom Sort Indicators

```vue
<template #sort-indicator="{ header, currentSort }">
  <div class="flex flex-col">
    <ChevronUpIcon 
      :class="{ 'text-blue-600': currentSort?.by === header.value && currentSort?.order === 'asc' }"
    />
    <ChevronDownIcon 
      :class="{ 'text-blue-600': currentSort?.by === header.value && currentSort?.order === 'desc' }"
    />
  </div>
</template>
```

### Custom Header Content

```vue
<template #header-commission_rate="{ header }">
  <div class="flex items-center gap-2">
    <span>{{ header.name }}</span>
    <InfoIconWithTooltip tooltipText="Commission rate for this seller" />
  </div>
</template>
```

### Responsive Design

The table automatically handles horizontal scrolling on smaller screens and includes custom scrollbar styling for better user experience.

### Dark Mode Support

All components include proper dark mode styling that automatically adapts based on the application's theme.

## Migration from Old Tables

To migrate existing tables to the new system:

1. Replace the old `<table>` element with `<Table>`
2. Define a `headers` array with your column configuration
3. Replace `<tr>` elements with `<TableRow>`
4. Use the new slot system for custom content
5. Leverage the built-in features like sorting, selection, and loading states

This new system provides consistency across all tables while maintaining flexibility for custom requirements.
