<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  iconClass: {
    type: String,
    default: 'from-purple-500 to-violet-600'
  }
})

const getCellValue = (row, column) => {
  if (Object.prototype.hasOwnProperty.call(column, 'value')) {
    return column.value
  }

  return row[column.key]
}
</script>

<template>
  <div class="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-300 dark:border-slate-700">
    <div class="p-6 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-3">
        <div
          class="p-2 bg-linear-to-br rounded-lg"
          :class="iconClass"
        >
          <slot name="icon" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {{ title }}
        </h3>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-100 dark:bg-slate-900/50">
          <tr class="text-xs font-semibold tracking-wide text-left text-slate-600 dark:text-gray-400 uppercase">
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="row in rows"
            :key="row.id"
            class="text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4"
              :class="{ 'text-sm': column.type !== 'primary' && column.type !== 'badge' }"
            >
              <p
                v-if="column.type === 'primary'"
                class="font-semibold text-slate-950 dark:text-white"
              >
                {{ getCellValue(row, column) }}
              </p>
              <span
                v-else-if="column.type === 'badge'"
                class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                {{ getCellValue(row, column) }}
              </span>
              <template v-else>
                {{ getCellValue(row, column) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
