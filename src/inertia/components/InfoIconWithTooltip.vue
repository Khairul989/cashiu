<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  tooltipText: {
    type: String,
    required: true,
  },
})

const showTooltip = ref(false)
const iconRef = ref<HTMLElement | null>(null)
const tooltipElementRef = ref<HTMLElement | null>(null)

const tooltipTop = ref('0px')
const tooltipLeft = ref('0px')

async function calculatePosition() {
  if (!iconRef.value || !tooltipElementRef.value) return;

  const iconRect = iconRef.value.getBoundingClientRect();
  let currentTooltipHeight = tooltipElementRef.value.offsetHeight;
  let currentTooltipWidth = tooltipElementRef.value.offsetWidth;

  if (currentTooltipHeight === 0 && currentTooltipWidth === 0 && showTooltip.value) {
    await nextTick();
    if (!tooltipElementRef.value) return;
    currentTooltipHeight = tooltipElementRef.value.offsetHeight;
    currentTooltipWidth = tooltipElementRef.value.offsetWidth;
  }

  if (currentTooltipHeight === 0 && currentTooltipWidth === 0 && showTooltip.value) {
    console.warn("Tooltip dimensions are zero, cannot calculate position accurately.");
    return;
  }

  // Calculate initial desired position
  let newTop = window.scrollY + iconRect.top - currentTooltipHeight - 8; // 8px offset from icon
  let newLeft = window.scrollX + iconRect.left + iconRect.width / 2 - currentTooltipWidth / 2;

  // Adjust for viewport boundaries
  const padding = 8; // 8px padding from viewport edges

  // Horizontal adjustment
  if (newLeft < window.scrollX + padding) {
    newLeft = window.scrollX + padding;
  } else if (newLeft + currentTooltipWidth > window.scrollX + window.innerWidth - padding) {
    newLeft = window.scrollX + window.innerWidth - currentTooltipWidth - padding;
  }

  // Vertical adjustment (position below icon if not enough space above)
  if (newTop < window.scrollY + padding) {
    // Try positioning below the icon
    const newTopBelow = window.scrollY + iconRect.bottom + 8;
    if (newTopBelow + currentTooltipHeight < window.scrollY + window.innerHeight - padding) {
      newTop = newTopBelow;
    } else {
      // If still no space below, stick to top with padding
      newTop = window.scrollY + padding;
    }
  }

  tooltipTop.value = `${newTop}px`;
  tooltipLeft.value = `${newLeft}px`;
}

// Renamed and simplified functions for hover
function handleMouseEnter() {
  showTooltip.value = true; // Watcher will trigger calculatePosition
}

function handleMouseLeave() {
  showTooltip.value = false;
}

watch(showTooltip, async (newValue) => {
  if (newValue) {
    await nextTick(); // Ensure tooltipElementRef is in the DOM and has dimensions
    if (tooltipElementRef.value) { // Check if still exists (might have been hidden quickly)
      calculatePosition(); // Calculate position immediately
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true); // Use capture phase for scroll
    }
  } else {
    window.removeEventListener('resize', calculatePosition);
    window.removeEventListener('scroll', calculatePosition, true);
  }
});

onMounted(() => {
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculatePosition);
  window.removeEventListener('scroll', calculatePosition, true);
});
</script>

<template>
  <div class="inline-flex items-center ml-1">
    <span
      ref="iconRef"
      class="cursor-pointer rounded-full w-4 h-4 flex items-center justify-center text-xs bg-gray-300 text-gray-700 hover:bg-gray-400"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      i
    </span>
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

<style scoped>
/* Styles here are for the icon container, not the teleported tooltip */
</style>