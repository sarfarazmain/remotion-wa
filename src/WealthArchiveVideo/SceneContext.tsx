import { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';

export const SceneContext = createContext<number | null>(null);

export const useSceneFrame = () => {
    const contextFrame = useContext(SceneContext);
    const globalFrame = useCurrentFrame();
    return contextFrame ?? globalFrame;
};
