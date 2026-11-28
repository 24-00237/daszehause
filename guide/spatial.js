// Each study supplies its own positions and camera; the guide never guesses screen coordinates.
export function pointAt(title) {
  const scene = window.studyGuideScene;
  const anchor = scene?.anchors().find(item => item.title === title);
  const stage = document.getElementById('stage');
  if (!anchor || !stage) return false;
  clearPointer();
  scene.focus(anchor);
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'study-pointer';
  marker.setAttribute('aria-label', 'Dismiss pointer to ' + title);
  marker.textContent = title;
  stage.append(marker);
  marker.onclick = clearPointer;
  stage.scrollIntoView({block:'center',behavior:'instant'});
  const camera = scene.camera();
  const vec = anchor.position.clone();
  function draw() {
    if (!marker.isConnected) return;
    // Re-resolve after a geometry change, and follow labels on moving models.
    const live = scene.locate ? scene.locate(anchor) : anchor.position;
    if (!live || camera !== scene.camera()) { clearPointer(); return; }
    vec.copy(live);
    scene.toWorld?.(vec);
    vec.project(camera);
    marker.hidden = Math.abs(vec.x)>1 || Math.abs(vec.y)>1 || Math.abs(vec.z)>1;
    marker.style.left = ((vec.x+1)*50)+'%';
    marker.style.top = ((1-vec.y)*50)+'%';
    requestAnimationFrame(draw);
  }
  draw();
  return true;
}
export function clearPointer() { document.querySelector('.study-pointer')?.remove(); }
