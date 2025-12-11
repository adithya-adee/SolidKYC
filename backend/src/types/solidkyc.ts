/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solidkyc.json`.
 */
export type Solidkyc = {
  "address": "5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg",
  "metadata": {
    "name": "solidkyc",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "deactivateIssuer",
      "discriminator": [
        52,
        10,
        163,
        187,
        247,
        22,
        150,
        37
      ],
      "accounts": [
        {
          "name": "issuerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "issuerName"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "issuerName",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeIssuer",
      "discriminator": [
        231,
        164,
        134,
        90,
        62,
        217,
        189,
        118
      ],
      "accounts": [
        {
          "name": "issuerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "zkPublicKeyX",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "zkPublicKeyY",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "issueCredential",
      "discriminator": [
        255,
        193,
        171,
        224,
        68,
        171,
        194,
        87
      ],
      "accounts": [
        {
          "name": "credentialAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "holder"
              },
              {
                "kind": "account",
                "path": "issuerAccount"
              }
            ]
          }
        },
        {
          "name": "issuerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuerAuthority"
              },
              {
                "kind": "arg",
                "path": "issuerName"
              }
            ]
          }
        },
        {
          "name": "issuerAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "holder"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "issuerName",
          "type": "string"
        },
        {
          "name": "credentialHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "issuedAt",
          "type": "i64"
        },
        {
          "name": "expiresAt",
          "type": "i64"
        },
        {
          "name": "zkSignatureR8x",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "zkSignatureR8y",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "zkSignatureS",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "reactivateIssuer",
      "discriminator": [
        174,
        162,
        75,
        94,
        50,
        88,
        97,
        99
      ],
      "accounts": [
        {
          "name": "issuerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "issuerName"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "issuerName",
          "type": "string"
        }
      ]
    },
    {
      "name": "revokeCredential",
      "discriminator": [
        38,
        123,
        95,
        95,
        223,
        158,
        169,
        87
      ],
      "accounts": [
        {
          "name": "credentialAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "credential_account.holder",
                "account": "userCredential"
              },
              {
                "kind": "account",
                "path": "issuerAccount"
              }
            ]
          }
        },
        {
          "name": "issuerAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuerAuthority"
              },
              {
                "kind": "arg",
                "path": "issuerName"
              }
            ]
          }
        },
        {
          "name": "issuerAuthority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "issuerName",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "issuerAccount",
      "discriminator": [
        126,
        234,
        14,
        239,
        71,
        204,
        88,
        61
      ]
    },
    {
      "name": "userCredential",
      "discriminator": [
        209,
        222,
        133,
        185,
        15,
        122,
        136,
        44
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedAdmin",
      "msg": "Unauthorized: Only admin can perform this action"
    },
    {
      "code": 6001,
      "name": "unauthorizedIssuer",
      "msg": "Unauthorized: Only the issuer can perform this action"
    },
    {
      "code": 6002,
      "name": "invalidIssuer",
      "msg": "Invalid issuer for this credential"
    },
    {
      "code": 6003,
      "name": "issuerInactive",
      "msg": "Issuer is not active"
    },
    {
      "code": 6004,
      "name": "issuerAlreadyInactive",
      "msg": "Issuer is already inactive"
    },
    {
      "code": 6005,
      "name": "issuerAlreadyActive",
      "msg": "Issuer is already active"
    },
    {
      "code": 6006,
      "name": "credentialAlreadyRevoked",
      "msg": "Credential has already been revoked"
    },
    {
      "code": 6007,
      "name": "invalidCredentialHash",
      "msg": "Invalid credential hash"
    },
    {
      "code": 6008,
      "name": "credentialExpired",
      "msg": "Credential has expired"
    },
    {
      "code": 6009,
      "name": "invalidZkProof",
      "msg": "Invalid ZK proof"
    }
  ],
  "types": [
    {
      "name": "issuerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "zkPublicKeyX",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "zkPublicKeyY",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "credentialsIssued",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userCredential",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "credentialHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "issuedAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "zkSignatureR8x",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "zkSignatureR8y",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "zkSignatureS",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "isRevoked",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
