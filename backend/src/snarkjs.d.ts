declare module 'snarkjs' {
  export namespace groth16 {
    function verify(
      vKey: any,
      publicSignals: string[],
      proof: any
    ): Promise<boolean>;
    
    function fullProve(
      input: any,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{ proof: any; publicSignals: string[] }>;
  }
}
