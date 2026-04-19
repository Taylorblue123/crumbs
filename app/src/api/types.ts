export interface UploadResponse {
  mbti: [string, string, string]
  description: [string, string, string]
  roast_line: [string, string, string]
  type_label: [string, string, string]
  thoughts: [string, string, string]
}

export interface PickedMbti {
  mbti: string
  description: string
  roastLine: string
  typeLabel: string
}

export interface PickedFull extends PickedMbti {
  thought: string
}

export type Step =
  | { kind: 'onboarding' }
  | { kind: 'transition1'; phase: 'uploading' | 'analyzing'; uploadPct?: number }
  | { kind: 'mbti'; options: UploadResponse }
  | { kind: 'thought'; options: UploadResponse; picked: PickedMbti }
  | { kind: 'card-loading'; picked: PickedFull }
  | { kind: 'card'; picked: PickedFull; totemUrl?: string }
  | { kind: 'transition2'; picked: PickedFull; genStatus?: string; genElapsed?: number }
  | { kind: 'video'; videoUrl: string; picked: PickedFull }
  | { kind: 'share'; videoUrl: string; picked: PickedFull }
  | { kind: 'error'; message: string; retryTo: Step['kind']; _picked?: PickedFull; _file?: File }
