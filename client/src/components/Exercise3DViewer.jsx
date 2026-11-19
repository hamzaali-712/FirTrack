import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const modelUrl = "/assets/3d/push-up.v1.glb";

function AnimatedModel({ onLoaded, playbackRate, playing, replayKey }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);
  const actions = useMemo(
    () => gltf.animations.map((clip) => mixer.clipAction(clip)),
    [gltf.animations, mixer],
  );
  const model = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z);

    gltf.scene.scale.setScalar(scale);
    gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    return gltf.scene;
  }, [gltf.scene]);

  useEffect(() => {
    actions.forEach((action) => {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset();
      action.play();
    });
    mixer.update(0);
    actions.forEach((action) => {
      action.paused = true;
    });
    onLoaded();
    return () => mixer.stopAllAction();
  }, [actions, mixer, onLoaded]);

  useEffect(() => {
    actions.forEach((action) => {
      action.paused = !playing;
      action.timeScale = playbackRate;
    });
  }, [actions, playbackRate, playing]);

  useEffect(() => {
    if (replayKey > 0) actions.forEach((action) => action.reset());
  }, [actions, replayKey]);

  useFrame((_, delta) => mixer.update(Math.min(delta, 0.05)));

  return <primitive object={model} />;
}

class ViewerErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError();
    console.error("The illustrative 3D exercise preview could not be rendered.", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function WebGLFallback({ exerciseName, onUnavailable, posterUrl }) {
  useEffect(() => onUnavailable(), [onUnavailable]);
  return (
    <div className="exercise-3d-fallback">
      <img alt={`${exerciseName} 3D illustration poster`} src={posterUrl} />
      <p role="status">3D preview unavailable. The poster and written instructions remain available.</p>
    </div>
  );
}

export default function Exercise3DViewer({ posterUrl, exerciseName }) {
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [replayKey, setReplayKey] = useState(0);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);

  const markUnavailable = useCallback(() => {
    setViewerReady(false);
    setViewerFailed(true);
  }, []);
  const markLoaded = useCallback(() => {
    setViewerReady(true);
    setViewerFailed(false);
  }, []);

  function replay() {
    setReplayKey((value) => value + 1);
    setPlaying(true);
  }

  const fallback = (
    <div className="exercise-3d-fallback">
      <img alt={`${exerciseName} 3D illustration poster`} src={posterUrl} />
      <p role="status">3D preview unavailable. The poster and written instructions remain available.</p>
    </div>
  );

  return (
    <div className="exercise-3d-viewer">
      <ViewerErrorBoundary fallback={fallback} onError={markUnavailable}>
        <div aria-label={`${exerciseName} illustrative 3D model`} className="exercise-3d-stage" role="img">
          <Canvas
            camera={{ position: [2.4, 1.1, 3.4], fov: 36, near: 0.1, far: 100 }}
            dpr={[1, 1.5]}
            fallback={
              <WebGLFallback
                exerciseName={exerciseName}
                onUnavailable={markUnavailable}
                posterUrl={posterUrl}
              />
            }
            gl={{ antialias: false, powerPreference: "low-power" }}
            onCreated={() => setViewerFailed(false)}
          >
            <color attach="background" args={["#0b2931"]} />
            <ambientLight intensity={1.6} />
            <directionalLight position={[3, 5, 4]} intensity={2} />
            <directionalLight position={[-3, 2, -4]} intensity={0.8} />
            <Suspense fallback={null}>
              <AnimatedModel
                onLoaded={markLoaded}
                playbackRate={playbackRate}
                playing={playing}
                replayKey={replayKey}
              />
            </Suspense>
          </Canvas>
        </div>
      </ViewerErrorBoundary>
      {viewerReady && !viewerFailed ? (
        <div aria-label="3D preview controls" className="exercise-3d-controls">
          <button
            aria-pressed={playing}
            className="button button-secondary"
            onClick={() => setPlaying((current) => !current)}
            type="button"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button className="button button-secondary" onClick={replay} type="button">
            Replay
          </button>
          <label>
            Speed
            <select
              onChange={(event) => setPlaybackRate(Number(event.target.value))}
              value={playbackRate}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={1.5}>1.5×</option>
            </select>
          </label>
          <span aria-live="polite" className="exercise-3d-status">
            {playing ? "Playing" : "Paused"}
          </span>
        </div>
      ) : (
        <p aria-live="polite" className="exercise-3d-status">
          {viewerFailed
            ? "Use the poster and written instructions; 3D playback is unavailable."
            : "Loading 3D preview…"}
        </p>
      )}
    </div>
  );
}
