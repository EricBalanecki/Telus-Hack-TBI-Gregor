declare module "webgazer" {
	type GazeData = { x: number; y: number } | null;

	type WebGazer = {
		setRegression: (name: string) => WebGazer;
		setGazeListener: (
			callback: (data: GazeData, elapsedTime?: number) => void
		) => WebGazer;
		saveDataAcrossSessions: (value: boolean) => WebGazer;
		begin: () => Promise<void> | void;
		end: () => void;
		clearData: () => void;
		showVideoPreview: (show: boolean) => WebGazer;
		showPredictionPoints: (show: boolean) => WebGazer;
		applyKalmanFilter: (enabled: boolean) => WebGazer;
		recordScreenPosition: (x: number, y: number, eventType?: string) => void;
		getStoredPoints: () => [number[], number[]];
		addMouseEventListeners: () => void;
		removeMouseEventListeners: () => void;
		params: {
			storingPoints: boolean;
			applyKalmanFilter: boolean;
		};
	};

	const webgazer: WebGazer;
	export default webgazer;
}
