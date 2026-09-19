/**
 * @purpose 切换头像对照页的浅色与深色观察底色
 * @role 独立 demo 控件
 * @deps index.html 的 data-surface 与按钮 aria-pressed，Tailwind 数据属性变体
 * @gotcha 只改预览页面，不保存博客主题或修改图片像素
 */
const choices = document.querySelectorAll("[data-surface-choice]");
for (const button of choices) {
  button.addEventListener("click", () => {
    document.body.dataset.surface = button.dataset.surfaceChoice;
    for (const choice of choices) {
      choice.setAttribute("aria-pressed", String(choice === button));
    }
  });
}
