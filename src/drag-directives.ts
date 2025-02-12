type Binding = {
  value: number[];
  modifiers: {
    horizontal?: boolean;
    vertical?: boolean;
  };
};

const mapDrag = new Map();

// @unocss-include
const selectNone = "select-none";
const dragId = "drag_id";

function getInRange(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
function getVerticalCursor(el: HTMLElement, binding: Binding) {
  let parent = el.parentElement!;
  const height = parent.clientHeight;
  const [min, max] = binding.value;

  let cursor = "";
  if (height > min && height < max) {
    cursor = "ns-resize";
  }
  if (height <= min) {
    cursor = "n-resize";
  }
  if (height >= max) {
    cursor = "s-resize";
  }
  parent.style.height = (height | 0) + "px";
  el.style.cursor = cursor;
}
function getHorizontalCursor(el: HTMLElement, binding: Binding) {
  let parent = el.parentElement!;
  const { width } = parent.getBoundingClientRect();
  const [min, max] = binding.value;

  let cursor = "";
  if (width > min && width < max) {
    cursor = "ew-resize";
  }
  if (width <= min) {
    cursor = "w-resize";
  }
  if (width >= max) {
    cursor = "e-resize";
  }
  parent.style.width = (width | 0) + "px";
  el.style.cursor = cursor;
}

export const vDrag = {
  mounted(el: HTMLElement, binding: Binding) {
    const { vertical, horizontal } = binding.modifiers;
    const [min, max] = binding.value;

    const id = `${Date.now()}`;
    el.dataset[dragId] = id;
    let parent = el.parentElement!;
    let isDrag = false;
    // el 为拖拽元素 可能在父元素的 上 下 左 右
    // 上下 w: 100% h: 1px
    // 左右 w: 1px h: 100%
    const isTop =
      Math.abs(
        el.getBoundingClientRect().top - parent.getBoundingClientRect().top
      ) < 10;

    const isLeft =
      Math.abs(
        el.getBoundingClientRect().left - parent.getBoundingClientRect().left
      ) < 10;

    vertical && getVerticalCursor(el, binding);
    horizontal && getHorizontalCursor(el, binding);

    const resizeObserver = new ResizeObserver(() => {
      if (isDrag) {
        vertical && getVerticalCursor(el, binding);
        horizontal && getHorizontalCursor(el, binding);
      }
    });

    // 观察目标元素
    resizeObserver.observe(parent);
    mapDrag.set(id, resizeObserver);

    let cursor = document.body.style.cursor;
    // 鼠标点击
    el.onmousedown = (e) => {
      document.body.style.cursor = el.style.cursor;
      document.body.classList.add(selectNone);
      isDrag = true;

      // 记录鼠标点击时的坐标
      let startY = e.y;
      let startX = e.x;

      // 鼠标移动
      document.onmousemove = (e) => {
        if (vertical) {
          const height = parent.clientHeight;

          const newHeight = height + (e.y - startY) * (isTop ? -1 : 1);
          parent.style.height = getInRange(newHeight, min, max) + "px";
          startY = e.y;
        }
        if (horizontal) {
          const width = parent.clientWidth;
          const newWidth = width + (e.x - startX) * (isLeft ? -1 : 1);
          parent.style.width = getInRange(newWidth, min, max) + "px";
          startX = e.x;
        }
        document.body.style.cursor = el.style.cursor;
      };
      // 鼠标抬起
      document.onmouseup = () => {
        document.onmousemove = null;
        document.onmouseup = null;
        document.body.style.cursor = cursor;
        document.body.classList.remove(selectNone);
        isDrag = false;
      };
    };
  },
  beforeUnmount(el: HTMLElement) {
    const id = el.dataset[dragId];
    if (id) {
      const resizeObserver = mapDrag.get(id);
      resizeObserver?.disconnect();
      mapDrag.delete(id);
    }
  },
};
