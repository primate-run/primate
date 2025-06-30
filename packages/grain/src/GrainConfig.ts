type GrainConfiguration = {
  extension: string;
  command: string;
  grainStdLib?: string;
  grainIncludeDirs: string[];
  noPervasives: boolean;
  strictSequence: boolean;
}

export default GrainConfiguration;
