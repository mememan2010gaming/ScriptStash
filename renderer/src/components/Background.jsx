/* Static themed background. The gradient and grain are driven entirely by
   CSS variables set per theme (see design-system/themes.js), so this layer
   needs no props and no animation — it re-skins instantly when the theme
   token changes. Carbon opts into a subtle grain via data-grain="on". */
export default function Background() {
  return (
    <div className="env-layer">
      <div className="env-bg" />
      <div className="env-grain" />
    </div>
  )
}
