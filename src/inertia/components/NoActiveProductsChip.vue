<script setup lang="ts">
import { ref, nextTick, watch, onBeforeUnmount } from 'vue';

defineProps({
  tooltipText: {
    type: String,
    required: true,
  },
  chipText: {
    type: String,
    default: 'No Active Products',
  },
});

const showTooltip = ref(false);
const chipRef = ref<HTMLElement | null>(null);
const tooltipElementRef = ref<HTMLElement | null>(null);

const tooltipTop = ref('0px');
const tooltipLeft = ref('0px');

async function calculatePosition() {
  if (!chipRef.value || !tooltipElementRef.value) return;

  const chipRect = chipRef.value.getBoundingClientRect();
  let tooltipHeight = tooltipElementRef.value.offsetHeight;
  let tooltipWidth = tooltipElementRef.value.offsetWidth;

  if (tooltipHeight === 0 && tooltipWidth === 0 && showTooltip.value) {
    await nextTick();
    if (!tooltipElementRef.value) return;
    tooltipHeight = tooltipElementRef.value.offsetHeight;
    tooltipWidth = tooltipElementRef.value.offsetWidth;
  }

  if (tooltipHeight === 0 && tooltipWidth === 0 && showTooltip.value) {
    console.warn("Tooltip dimensions are zero for NoActiveProductsChip, cannot calculate position accurately.");
    return;
  }

  tooltipTop.value = `${window.scrollY + chipRect.top - tooltipHeight - 8}px`; // 8px offset
  tooltipLeft.value = `${window.scrollX + chipRect.left + chipRect.width / 2 - tooltipWidth / 2}px`;
}

function handleMouseEnter() {
  showTooltip.value = true;
}

function handleMouseLeave() {
  showTooltip.value = false;
}

watch(showTooltip, async (newValue) => {
  if (newValue) {
    await nextTick();
    if (tooltipElementRef.value && chipRef.value) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
    }
  } else {
    window.removeEventListener('resize', calculatePosition);
    window.removeEventListener('scroll', calculatePosition, true);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculatePosition);
  window.removeEventListener('scroll', calculatePosition, true);
});
</script>

<template>
  <div
    ref="chipRef"
    class="mt-1 inline-block px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-md cursor-default"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    {{ chipText }}
    <Teleport to="body">
      <div
        ref="tooltipElementRef"
        v-if="showTooltip"
        :style="{ top: tooltipTop, left: tooltipLeft, position: 'absolute', zIndex: 1050 }"
        class="w-64 whitespace-normal rounded-md bg-gray-700 p-2 text-xs text-white shadow-lg"
      >
        {{ tooltipText }}
      </div>
    </Teleport>
  </div>
</template>