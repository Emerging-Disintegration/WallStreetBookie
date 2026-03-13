// Custom window controls for frameless mode
function TitleBar() {
  const close    = () => window.pywebview.api.close_window();
  const minimize = () => window.pywebview.api.minimize_window();
  const maximize = () => window.pywebview.api.toggle_maximize();

  return (
    <div className="title-bar">
      <div className="title-bar-controls">
        <button className="wb-btn wb-close"    onClick={close}    title="Close"    aria-label="Close" />
        <button className="wb-btn wb-minimize" onClick={minimize} title="Minimize" aria-label="Minimize" />
        <button className="wb-btn wb-maximize" onClick={maximize} title="Maximize" aria-label="Maximize" />
      </div>
      <div className="title-bar-drag" />
    </div>
  );
}

export default TitleBar;
