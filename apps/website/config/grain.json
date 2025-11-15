{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "Grain",
  "patterns": [
    {
      "include": "#top-level-statements"
    }
  ],
  "repository": {
    "modules": {
      "patterns": [
        {
          "begin": "\\b(module)\\b\\s+([A-Z]\\w*)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "storage.type.grain" },
            "2": { "name": "entity.name.type.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#top-level-statements" }]
        },
        {
          "match": "\\b(module)\\b\\s+([A-Z]\\w*)",
          "captures": {
            "1": { "name": "storage.type.grain" },
            "2": { "name": "entity.name.type.grain" }
          }
        }
      ]
    },
    "bindings": {
      "patterns": [
        {
          "match": "\\b((?:let)\\b\\s*(?:rec\\b)?\\s*(?:mut\\b)?)\\b\\s*(?!rec|mut)([a-z]\\w*)\\s*(:.*?)?(=)(?=.*=>)",
          "captures": {
            "1": {
              "name": "storage.type.grain"
            },
            "2": {
              "name": "entity.name.function.grain"
            },
            "3": {
              "patterns": [{ "include": "#type-annotations" }]
            },
            "4": {
              "name": "keyword.operator.grain"
            }
          }
        },
        {
          "match": "\\b((?:let)\\b\\s*(?:rec\\b)?\\s*(?:mut\\b)?)\\b\\s*(?!rec|mut)([a-z]\\w*)\\s*(:.*?)?(=)(?=\\s*pattern\\b)",
          "captures": {
            "1": {
              "name": "storage.type.grain"
            },
            "2": {
              "name": "entity.name.function.grain"
            },
            "3": {
              "patterns": [
                {
                  "include": "#type-annotations"
                }
              ]
            },
            "4": {
              "name": "keyword.operator.grain"
            }
          }
        },
        {
          "begin": "\\b((?:let)\\b\\s*(?:rec\\b)?\\s*(?:mut\\b)?)\\b\\s*(\\()",
          "end": "(\\))\\s*(:.*?)?(=)",
          "beginCaptures": {
            "1": { "name": "storage.type.grain" },
            "2": { "name": "punctuation.definition.parameters.start.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" },
            "2": {
              "patterns": [
                {
                  "include": "#type-annotations"
                }
              ]
            },
            "3": { "name": "keyword.operator.grain" }
          },
          "patterns": [{ "include": "#binding-destructure" }]
        },
        {
          "match": "\\b((?:let)\\b\\s*(?:rec\\b)?\\s*(?:mut\\b)?)\\b\\s*(?!rec|mut)([a-z]\\w*)\\s*(:.*?)?(=)",
          "captures": {
            "1": {
              "name": "storage.type.grain"
            },
            "2": {
              "patterns": [
                {
                  "include": "#identifier"
                }
              ]
            },
            "3": {
              "patterns": [
                {
                  "include": "#type-annotations"
                }
              ]
            },
            "4": {
              "name": "keyword.operator.grain"
            }
          }
        },
        {
          "match": "\\b((?:let)\\b\\s*(?:rec\\b)?\\s*(?:mut\\b)?)\\b\\s*(?!rec|mut)([a-z]\\w*)\\b\\s*(:.*)?",
          "captures": {
            "1": {
              "name": "storage.type.grain"
            },
            "2": {
              "patterns": [
                {
                  "include": "#identifier"
                }
              ]
            },
            "3": {
              "patterns": [{ "include": "#type-annotations" }]
            }
          }
        }
      ]
    },
    "binding-destructure": {
      "patterns": [
        {
          "begin": "(?=\\()",
          "end": "(?<=\\))",
          "patterns": [{ "include": "#binding-destructure" }]
        },
        { "include": "#typed-identifier" }
      ]
    },
    "comments": {
      "patterns": [
        {
          "match": "\\/\\/.*$",
          "name": "comment.line.grain"
        },
        {
          "match": "#!.*$",
          "name": "comment.line.grain"
        },
        {
          "begin": "\\/\\*\\*",
          "end": "\\*\\/",
          "name": "comment.block.grain",
          "patterns": [
            {
              "match": "((@)module)\\s+(\\b\\w+\\b)(:)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "name": "entity.name.type.graindoc" },
                "4": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            },
            {
              "match": "((@)example)\\s+(.*)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "patterns": [{ "include": "#top-level-statements" }] }
              }
            },
            {
              "match": "((@)since)\\s+\\b(v\\d+\\.\\d+\\.\\d+)\\b",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "name": "constant.numeric.graindoc" }
              }
            },
            {
              "match": "((@)history)\\s+(v\\d+\\.\\d+\\.\\d+)(:)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "name": "constant.numeric.graindoc" },
                "4": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            },
            {
              "match": "((@)param)\\s+(\\b\\w+\\b)(:)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "name": "variable.other.graindoc" },
                "4": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            },
            {
              "match": "((@)section)\\s+(\\b\\w+\\b)(:)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": { "name": "variable.other.graindoc" },
                "4": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            },
            {
              "match": "((@)throws)\\s+(.*?)(:)",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" },
                "3": {
                  "patterns": [{ "include": "#type-variant" }]
                },
                "4": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            },
            {
              "match": "((@)(param|returns|module|example|section|deprecated|since|history|throws))",
              "captures": {
                "1": { "name": "storage.type.graindoc" },
                "2": { "name": "punctuation.definition.block.tag.graindoc" }
              }
            }
          ]
        },
        {
          "begin": "\\/\\*",
          "end": "\\*\\/",
          "name": "comment.block.grain"
        }
      ]
    },
    "type-args": {
      "patterns": [
        {
          "match": "(\\b[a-z]\\w*\\b)(,)?",
          "captures": {
            "1": { "name": "variable.language.grain" },
            "2": { "name": "punctuation.definition.parameters.begin.grain" }
          }
        }
      ]
    },
    "type-constructor": {
      "patterns": [
        {
          "begin": "(\\()",
          "end": "(\\))",
          "captures": {
            "1": { "name": "punctuation.definition.parameters.grain" }
          },
          "patterns": [
            {
              "match": ",",
              "name": "punctuation.definition.parameters.grain"
            },
            { "include": "#type-constructor" }
          ]
        },
        {
          "begin": "(\\b[A-Z]\\w*\\b)\\s*(<)",
          "end": "((?<!-)>)",
          "beginCaptures": {
            "1": {
              "name": "entity.name.type.grain"
            },
            "2": { "name": "punctuation.definition.parameters.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.grain" }
          },
          "patterns": [
            { "include": "#type" },
            {
              "match": ",",
              "name": "punctuation.definition.parameters.grain"
            }
          ]
        },
        {
          "match": "(\\b[A-Z]\\w*\\b)",
          "captures": {
            "1": {
              "name": "entity.name.type.grain"
            }
          }
        }
      ]
    },
    "type": {
      "patterns": [
        {
          "begin": "(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": "(,)",
              "captures": {
                "1": {
                  "name": "punctuation.definition.parameters.grain"
                }
              }
            },
            { "include": "#type" }
          ]
        },
        {
          "match": "(->|\\.)",
          "name": "keyword.operator.grain"
        },
        { "include": "#type-args" },
        { "include": "#type-constructor" }
      ]
    },
    "type-annotations": {
      "patterns": [
        {
          "begin": "(:|->)\\s*(?=\\()",
          "end": "(?<=\\))",
          "captures": {
            "1": { "name": "keyword.operator.grain" }
          },
          "patterns": [{ "include": "#type" }]
        },
        {
          "match": "(->)\\s*(\\w+(\\.\\w+)*(<.*?(?<!-)>)?)",
          "captures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "match": "(:)\\s*(\\w+(\\.\\w+)*(<.*?(?<!-)>)?\\s*->\\s*\\w+(<.*?(?<!-)>)?)",
          "captures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "match": "(:)\\s*(\\w+(\\.\\w+)*(<.*?(?<!-)>)?\\s*->\\s*\\(.*\\))",
          "captures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "match": "(:)\\s*(\\w+(\\.\\w+)*(<.*?(?<!-)>)?)",
          "captures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "match": "(:)",
          "captures": {
            "1": { "name": "keyword.operator.grain" }
          }
        }
      ]
    },
    "data-declarations": {
      "patterns": [
        {
          "match": "\\b(type)\\b\\s+([A-Z]\\w*\\s*(<.*>\\s*)?)\\s*(=)\\s*(.*)",
          "captures": {
            "1": { "name": "storage.type.grain" },
            "2": { "name": "entity.name.type.grain" },
            "3": { "patterns": [{ "include": "#type-vector" }] },
            "4": { "name": "keyword.operator.grain" },
            "5": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "begin": "\\b(enum)\\b\\s+(\\b(rec)\\b\\s+)?([A-Z]\\w*\\s*(<.*>\\s*)?)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "storage.type.grain" },
            "3": { "name": "storage.type.grain" },
            "4": { "name": "entity.name.type.grain" },
            "5": { "patterns": [{ "include": "#type-vector" }] },
            "6": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            { "include": "#type-variant" },
            {
              "match": ",",
              "name": "punctuation.definition.grain"
            }
          ]
        },
        {
          "begin": "\\b(record)\\b\\s+(\\b(rec)\\b\\s+)?([A-Z]\\w*\\s*(<.*>\\s*)?)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "storage.type.grain" },
            "3": { "name": "storage.type.grain" },
            "4": { "name": "entity.name.type.grain" },
            "5": { "patterns": [{ "include": "#type-vector" }] },
            "6": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": "(mut\\b\\s*)?(\\w+)(?=\\s*:)",
              "captures": {
                "1": { "name": "storage.type.grain" },
                "2": { "name": "entity.other.grain" }
              }
            },
            {
              "include": "#type-annotations"
            },
            {
              "match": ",",
              "name": "punctuation.definition.grain"
            },
            {
              "include": "#comments"
            },
            {
              "match": "mut",
              "name": "storage.type.grain"
            }
          ]
        },
        {
          "match": "\\b(exception)\\b\\s+(.*)",
          "captures": {
            "1": { "patterns": [{ "include": "#keywords" }] },
            "2": { "patterns": [{ "include": "#type-variant" }] }
          }
        },
        {
          "match": "(type|record|enum)\\s+(\\b(rec)\\b\\s+)?([A-Z]\\w*)(<.*>)?",
          "captures": {
            "1": { "name": "storage.type.grain" },
            "3": { "name": "storage.type.grain" },
            "4": { "name": "entity.name.type.grain" },
            "5": { "patterns": [{ "include": "#type-vector" }] }
          }
        }
      ]
    },
    "statement": {
      "patterns": [
        {
          "begin": "\\b(if|while|for)\\b\\s*(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "name": "keyword.control.grain" },
            "2": { "name": "punctuation.description.parameters.start.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.description.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": "(,|;)",
              "name": "punctuation.support.grain"
            },
            { "include": "#expressions" }
          ]
        },
        {
          "match": "\\b(if|else|while|for)\\b",
          "name": "keyword.control.grain"
        }
      ]
    },
    "function-call": {
      "patterns": [
        {
          "begin": "\\b([a-z]\\w*)\\b\\s*(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "name": "entity.name.function.grain" },
            "2": { "name": "punctuation.description.parameters.start.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.description.parameters.end.grain" }
          },
          "patterns": [
            {
              "begin": "(?<=\\()",
              "end": "(?=\\)|,)",
              "patterns": [{ "include": "#expressions" }]
            },
            {
              "begin": "(?<=,)",
              "end": "(?=\\)|,)",
              "patterns": [{ "include": "#expressions" }]
            },
            {
              "match": ",",
              "name": "punctuation.support.grain"
            }
          ]
        }
      ]
    },
    "function-body": {
      "patterns": [
        {
          "begin": "(=>)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "begin": "(=>)\\s*(?=\\()",
          "end": "(?<=\\))",
          "captures": {
            "1": { "name": "keyword.operator.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "match": "(=>)(.*?)",
          "captures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "patterns": [{ "include": "#expressions" }] }
          }
        }
      ]
    },
    "block-body": {
      "patterns": [
        {
          "begin": "(?<=\\))\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "begin": "(?<=else)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        }
      ]
    },
    "records": {
      "patterns": [
        {
          "begin": "(\\{)",
          "end": "(\\})",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [
            {
              "begin": "\\b(\\w+)\\b\\s*(:)",
              "end": "(?=(,|\\}|#))",
              "beginCaptures": {
                "1": { "name": "entity.name.grain" },
                "2": { "name": "punctuation.description.grain" }
              },
              "patterns": [{ "include": "#expressions" }]
            },
            {
              "match": "\\b(\\w+)\\b",
              "name": "entity.name.grain"
            },
            {
              "match": ",",
              "name": "punctuation.description.parameters.grain"
            },
            {
              "include": "#comments"
            }
          ]
        }
      ]
    },
    "lists": {
      "patterns": [
        {
          "begin": "(\\[)",
          "end": "(\\])",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [
            { "include": "#expressions" },
            {
              "match": ",",
              "name": "punctuation.description.parameters.grain"
            }
          ]
        }
      ]
    },
    "arrays": {
      "patterns": [
        {
          "begin": "(\\[>)",
          "end": "(\\])",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [
            { "include": "#expressions" },
            {
              "match": ",",
              "name": "punctuation.description.parameters.grain"
            }
          ]
        }
      ]
    },
    "expressions": {
      "patterns": [
        { "include": "#comments" },
        { "include": "#bindings" },
        { "include": "#use" },
        { "include": "#function-body" },
        { "include": "#block-body" },
        { "include": "#tuple" },
        { "include": "#records" },
        { "include": "#arrays" },
        { "include": "#lists" },
        { "include": "#match" },
        { "include": "#pattern" },
        { "include": "#statement" },
        { "include": "#function-call" },
        { "include": "#keywords" },
        { "include": "#constant" },
        { "include": "#type-annotations" },
        { "include": "#external-identifier" },
        { "include": "#identifier" },
        { "include": "#type-variant-constructor" }
      ]
    },
    "use": {
      "patterns": [
        {
          "begin": "\\b(use)\\b\\s*\\b([A-Z]\\w*((\\.)[A-Z]\\w*)*)\\b\\s*(\\.)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "patterns": [{ "include": "#keywords" }] },
            "2": { "name": "entity.name.module.grain" },
            "4": {
              "name": "keyword.operator.accessor.grain"
            },
            "5": {
              "name": "keyword.operator.accessor.grain"
            },
            "6": { "name": "punctuation.definition.start.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.end.grain" }
          },
          "patterns": [
            {
              "match": "(\\*|\\,)",
              "name": "punctuation.support.grain"
            },
            {
              "match": "\\b(type|exception)\\b\\s*([A-Z]\\w*)\\b",
              "captures": {
                "1": { "patterns": [{ "include": "#keywords" }] },
                "2": { "patterns": [{ "include": "#type" }] }
              }
            },
            {
              "include": "#keywords"
            },
            {
              "match": "\\b[A-Z]\\w*\\b",
              "name": "entity.name.module.grain"
            },
            { "include": "#identifier" }
          ]
        },
        {
          "match": "\\b(use)\\b\\s*\\b([A-Z]\\w*((\\.)[A-Z]\\w*)*)\\b\\s*(\\.)\\s*(\\*)?",
          "captures": {
            "1": { "patterns": [{ "include": "#keywords" }] },
            "2": { "name": "entity.name.module.grain" },
            "4": {
              "name": "keyword.operator.accessor.grain"
            },
            "5": {
              "name": "keyword.operator.accessor.grain"
            },
            "6": {
              "name": "keyword.operator.grain"
            }
          }
        },
        {
          "match": "\\b(use)\\b\\s*\\b([A-Z]\\w*((\\.)[A-Z]\\w*)*)\\b(\\.)?",
          "captures": {
            "1": { "patterns": [{ "include": "#keywords" }] },
            "2": { "name": "entity.name.module.grain" },
            "4": {
              "name": "keyword.operator.accessor.grain"
            },
            "5": {
              "name": "keyword.operator.accessor.grain"
            }
          }
        }
      ]
    },
    "operator": {
      "patterns": [
        {
          "match": "(==|!=|<|>|\\^|\\+|-|\\*|%|/|&|\\||\\?\\?)[$&\\*/\\+\\-=><\\^\\|\\!\\?%:\\.]*",
          "name": "keyword.operator.grain"
        },
        {
          "match": "(<=|>=|<|>|==|!=|:=|\\!)",
          "name": "keyword.operator.grain"
        },
        {
          "match": "\\bis(nt)?\\b",
          "name": "keyword.operator.grain"
        },
        {
          "begin": "(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#operator" }]
        }
      ]
    },
    "identifier": {
      "patterns": [
        {
          "include": "#operator"
        },
        {
          "match": "(\\.\\.\\.|\\.)",
          "name": "keyword.operator.grain"
        },
        {
          "match": "\\b_[A-Z0-9_]+\\b",
          "name": "variable.other.constant.grain"
        },
        {
          "match": "\\b[a-z]\\w*\\b",
          "name": "variable.name.grain"
        }
      ]
    },
    "external-identifier": {
      "patterns": [
        {
          "match": "\\b([A-Z]\\w*)\\b(\\.)",
          "captures": {
            "1": {
              "name": "entity.name.module.grain"
            },
            "2": {
              "name": "keyword.operator.accessor.grain"
            }
          }
        }
      ]
    },
    "typed-identifier": {
      "patterns": [
        {
          "match": "\\b([a-z]\\w*)\\b\\s*(:.*)(?=,)",
          "captures": {
            "1": {
              "patterns": [
                {
                  "include": "#identifier"
                }
              ]
            },
            "2": {
              "patterns": [{ "include": "#type-annotations" }]
            }
          }
        },
        {
          "match": "\\b([a-z]\\w*)\\b\\s*(:.*)(?=\\))",
          "captures": {
            "1": {
              "patterns": [
                {
                  "include": "#identifier"
                }
              ]
            },
            "2": {
              "patterns": [{ "include": "#type-annotations" }]
            }
          }
        },
        { "include": "#identifier" }
      ]
    },
    "constant": {
      "patterns": [
        { "include": "#number" },
        { "include": "#strings" },
        { "include": "#boolean" },
        { "include": "#void" }
      ]
    },
    "boolean": {
      "patterns": [
        {
          "match": "\\b(true|false)\\b",
          "name": "constant.language.grain"
        }
      ]
    },
    "void": {
      "patterns": [
        {
          "match": "\\b(void)\\b",
          "name": "constant.language.grain"
        }
      ]
    },
    "number": {
      "patterns": [
        {
          "match": "\\b(\\d[\\d_]*)\\s*/\\s*(\\d[\\d_]*)(r?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "3": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(\\d[\\d_]*)(\\.[\\d_]*)?([eE][+-]?\\d[\\d_]*)?([fdwW]?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "4": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(0[xX][\\da-fA-F][\\da-fA-F_]*)(\\.[\\da-fA-F][\\da-fA-F_]*)?([pP][+-]?\\d[\\d_]*)?([fdwW]?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "4": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(\\d[\\d_]*)(([sSlLnNt]|u[lLsS])?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "2": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(0[xX][\\da-fA-F][\\da-fA-F_]*)(([sSlLnNt]|u[lLsS])?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "3": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(0[oO][0-7][0-7_]*)(([sSlLnNt]|u[lLsS])?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "3": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(0[bB][01][01_]*)(([sSlLnNt]|u[lLsS])?)\\b",
          "name": "constant.numeric.grain",
          "captures": {
            "3": {
              "name": "entity.name.type.numeric.grain"
            }
          }
        },
        {
          "match": "\\b(Infinity)\\b",
          "name": "constant.numeric.grain"
        },
        {
          "match": "\\b(NaN)\\b",
          "name": "constant.numeric.grain"
        }
      ]
    },
    "tuple": {
      "patterns": [
        {
          "begin": "(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": ",",
              "name": "punctuation.definition.parameters.grain"
            },
            { "include": "#expressions" },
            { "include": "#binding-destructure" }
          ]
        }
      ]
    },
    "imports": {
      "patterns": [
        {
          "begin": "(?<=import)",
          "end": "(?=from)",
          "patterns": [
            {
              "match": "(\\*|\\,)",
              "name": "punctuation.support.grain"
            },
            {
              "begin": "(\\{)",
              "end": "(\\})",
              "beginCaptures": {
                "1": { "name": "punctuation.definition.start.grain" }
              },
              "endCaptures": {
                "1": { "name": "punctuation.definition.end.grain" }
              },
              "patterns": [
                { "match": ",", "name": "punctuation.definition.grain" },
                { "include": "#expressions" }
              ]
            },
            {
              "match": "\\b[A-Z]\\w*\\b",
              "name": "entity.name.module.grain"
            }
          ]
        },
        {
          "match": "\\b(from)\\b\\s*(\\\".*\\\")\\s*\\b(include)\\b\\s*\\b([A-Z]\\w*)\\b(\\s*(as)\\s*\\b([A-Z]\\w*)\\b)?",
          "captures": {
            "1": {
              "patterns": [{ "include": "#keywords" }]
            },
            "2": {
              "patterns": [{ "include": "#constant" }]
            },
            "3": {
              "patterns": [{ "include": "#keywords" }]
            },
            "4": {
              "name": "entity.name.module.grain"
            },
            "5": {
              "patterns": [{ "include": "#keywords" }]
            },
            "6": {
              "name": "entity.name.module.grain"
            }
          }
        }
      ]
    },
    "exports": {
      "patterns": [
        {
          "match": "\\b(export)\\b\\s*(\\*)\\s*\\b(except)\\b(.*?)(?=$|;)",
          "captures": {
            "1": { "name": "keyword.control.grain" },
            "2": { "name": "punctuation.support.grain" },
            "3": { "name": "keyword.control.grain" },
            "4": {
              "patterns": [
                {
                  "include": "#expressions"
                }
              ]
            }
          }
        },
        {
          "match": "\\b(export)\\b\\s*(\\*)",
          "captures": {
            "1": { "name": "keyword.control.grain" },
            "2": { "name": "punctuation.support.grain" }
          }
        }
      ]
    },
    "foreigns": {
      "patterns": [
        {
          "begin": "\\b(import|export)\\s*\\b(foreign)\\b(\\s*\\bwasm\\b)\\s*",
          "end": "\\b(from)\\b\\s+(.*)(?=$|;)",
          "beginCaptures": {
            "1": { "name": "keyword.control.grain" },
            "2": { "name": "keyword.control.grain" },
            "3": { "name": "variable.language.grain" }
          },
          "endCaptures": {
            "1": { "name": "keyword.control.grain" },
            "2": { "patterns": [{ "include": "#strings" }] }
          },
          "patterns": [{ "include": "#expressions" }]
        }
      ]
    },
    "primitives": {
      "patterns": [
        {
          "begin": "\\b(primitive)\\b",
          "end": "(=)\\s*(('|\").*('|\"))$",
          "beginCaptures": {
            "1": { "name": "keyword.control.grain" }
          },
          "endCaptures": {
            "1": { "name": "keyword.control.grain" },
            "2": {
              "patterns": [
                {
                  "include": "#strings"
                }
              ]
            }
          },
          "patterns": [
            {
              "include": "#expressions"
            }
          ]
        }
      ]
    },
    "strings": {
      "patterns": [
        {
          "name": "string.quoted.double.grain",
          "begin": "\"",
          "end": "\"",
          "patterns": [
            {
              "include": "#string-escape"
            }
          ]
        },
        {
          "name": "string.quoted.single.grain",
          "begin": "'",
          "end": "'",
          "patterns": [
            {
              "include": "#string-escape"
            }
          ]
        }
      ]
    },
    "string-escape": {
      "patterns": [
        {
          "name": "constant.character.escape.grain",
          "match": "(\\\\\\d{1,3}|\\\\x[A-Fa-f0-9]{1,2}|\\\\u[A-Fa-f0-9]{4}|\\\\u\\{[A-Fa-f0-9]{1,6}\\}|\\\\[bftvrn'\"\\\\])"
        },
        {
          "name": "invalid.illegal.grain",
          "match": "\\\\."
        }
      ]
    },
    "keywords": {
      "patterns": [
        {
          "match": "\\b(throw|exception|while|for|continue|break|return|match|when|pattern|assert|fail|import|export|from|include|use|provide|abstract|except|as)\\b",
          "name": "keyword.control.grain"
        },
        {
          "match": "\\b(module|let|rec|mut|record|type|enum|and|foreign|primitive)\\b",
          "name": "storage.type.grain"
        }
      ]
    },
    "top-level-statements": {
      "patterns": [
        { "include": "#modules" },
        { "include": "#foreigns" },
        { "include": "#imports" },
        { "include": "#exports" },
        { "include": "#primitives" },
        { "include": "#data-declarations" },
        { "include": "#expressions" },
        { "include": "#comments" },
        {
          "match": "(;)",
          "captures": {
            "1": { "name": "punctuation.definition.parameters.grain" }
          }
        }
      ]
    },
    "program": {
      "patterns": [{ "include": "#top-level-statements" }]
    },
    "type-var": {
      "patterns": [
        {
          "match": "([a-z]\\w*)",
          "captures": {
            "1": { "name": "variable.language.grain" }
          }
        },
        {
          "begin": "\\(",
          "end": "\\)",
          "patterns": [
            {
              "include": "#type-var"
            }
          ]
        }
      ]
    },
    "type-vector": {
      "patterns": [
        {
          "begin": "(<)",
          "end": "(>)",
          "captures": {
            "1": { "name": "punctuation.definition.parameters.grain" }
          },
          "patterns": [
            { "include": "#type-var" },
            { "include": "#type-constructor" },
            {
              "match": ",",
              "name": "punctuation.definition.parameters.grain"
            }
          ]
        }
      ]
    },
    "type-variant": {
      "patterns": [
        { "include": "#comments" },
        {
          "begin": "\\b([A-Z]\\w*)\\b\\s*(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] },
            "2": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": "(,)",
              "captures": {
                "1": { "name": "punctuation.definition.parameters.grain" }
              }
            },
            { "include": "#type" }
          ]
        },
        {
          "match": "\\b([A-Z]\\w*)\\b",
          "captures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] }
          }
        },
        {
          "comment": "Special support for the List type in Pervasives.",
          "match": "((\\[\\])|(\\[\\.\\.\\.])(\\(a, List<a>\\)))",
          "captures": {
            "2": { "name": "entity.name.function.grain" },
            "3": { "name": "entity.name.function.grain" },
            "4": { "patterns": [{ "include": "#type" }] }
          }
        },
        {
          "comment": "Special support for the constant types in Pervasives.",
          "match": "(true|false|void)",
          "patterns": [{ "include": "#constant" }]
        }
      ]
    },
    "type-variant-name": {
      "patterns": [
        {
          "match": "\\b([A-Z]\\w*)\\b",
          "captures": {
            "1": { "name": "entity.name.function.grain" }
          }
        }
      ]
    },
    "type-variant-constructor": {
      "patterns": [
        {
          "include": "#comments"
        },
        {
          "begin": "\\b([A-Z]\\w*)\\b\\s*(\\()",
          "end": "(\\))",
          "beginCaptures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] },
            "2": { "name": "punctuation.definition.parameters.begin.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [
            {
              "match": "(,)",
              "captures": {
                "1": { "name": "punctuation.definition.parameters.grain" }
              }
            },
            { "include": "#expressions" }
          ]
        },
        {
          "match": "\\b([A-Z]\\w*)\\b",
          "captures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] }
          }
        },
        {
          "include": "#constant"
        }
      ]
    },
    "type-destructor-tuple": {
      "patterns": [
        {
          "begin": "\\(",
          "end": "\\)",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [{ "include": "#type-destructor" }]
        }
      ]
    },
    "type-destructor-list": {
      "patterns": [
        {
          "begin": "(\\[>?)",
          "end": "(\\])",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [
            {
              "match": "\\b([a-z]\\w*)\\b",
              "captures": {
                "1": { "name": "variable.language.grain" }
              }
            },
            {
              "match": ",",
              "name": "punctuation.description.parameters.grain"
            },
            {
              "match": "\\.\\.\\.",
              "name": "keyword.operator.grain"
            },
            { "include": "#type-destructor" }
          ]
        }
      ]
    },
    "type-destructor-record": {
      "patterns": [
        {
          "begin": "(\\{)",
          "end": "(\\})",
          "captures": {
            "1": { "name": "punctuation.description.grain" }
          },
          "patterns": [
            {
              "match": "\\b([a-z]\\w*)\\b\\s*(:)",
              "captures": {
                "1": { "name": "entity.name.grain" },
                "2": { "name": "punctuation.description.parameters.grain" }
              }
            },
            {
              "match": "\\b([a-z]\\w*)\\b",
              "captures": {
                "1": { "name": "variable.language.grain" }
              }
            },
            {
              "match": ",",
              "name": "punctuation.description.parameters.grain"
            },
            { "include": "#type-destructor" }
          ]
        }
      ]
    },
    "type-destructor": {
      "patterns": [
        {
          "include": "#type-annotations"
        },
        {
          "begin": "\\b([A-Z]\\w*)\\b(?=\\s*\\()",
          "end": "(?<=\\))",
          "beginCaptures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] }
          },
          "patterns": [
            {
              "begin": "(\\()",
              "end": "(\\))",
              "captures": {
                "1": { "name": "punctuation.definition.parameters.grain" }
              },
              "patterns": [
                { "include": "#constant" },
                {
                  "match": "(\\||\\bas\\b)",
                  "captures": {
                    "1": { "name": "keyword.operator.grain" }
                  }
                },
                {
                  "match": "\\b([a-z]\\w*)\\b",
                  "captures": {
                    "1": { "name": "variable.language.grain" }
                  }
                },
                {
                  "match": "\\b(_)\\b",
                  "captures": {
                    "1": { "name": "meta.separator.grain" }
                  }
                },
                {
                  "match": "(,)",
                  "captures": {
                    "1": { "name": "punctuation.definition.parameters.grain" }
                  }
                },
                {
                  "include": "#type-destructor"
                }
              ]
            }
          ]
        },
        { "include": "#constant" },
        {
          "match": "(\\||\\bas\\b)",
          "captures": {
            "1": { "name": "keyword.operator.grain" }
          }
        },
        {
          "match": "\\b([a-z]\\w*)\\b",
          "captures": {
            "1": {
              "patterns": [
                {
                  "include": "#identifier"
                }
              ]
            }
          }
        },
        {
          "match": "\\b([A-Z]\\w*)\\b",
          "captures": {
            "1": { "patterns": [{ "include": "#type-variant-name" }] }
          }
        },
        {
          "match": "\\b(_)\\b",
          "captures": {
            "1": { "name": "meta.separator.grain" }
          }
        },
        { "include": "#type-destructor-tuple" },
        { "include": "#type-destructor-record" },
        { "include": "#type-destructor-list" }
      ]
    },
    "pattern-variant": {
      "patterns": [
        {
          "begin": "(when)",
          "end": "(?==>)",
          "beginCaptures": {
            "1": { "name": "keyword.control.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "begin": "(=>)\\s*(\\{)",
          "end": "(\\})",
          "beginCaptures": {
            "1": { "name": "keyword.operator.grain" },
            "2": { "name": "punctuation.definition.parameters.start.grain" }
          },
          "endCaptures": {
            "1": { "name": "punctuation.definition.parameters.end.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "begin": "(=>)",
          "end": "((?=,)(?<!,)|(?=\\}))",
          "beginCaptures": {
            "1": { "name": "keyword.operator.grain" }
          },
          "patterns": [{ "include": "#expressions" }]
        },
        {
          "match": ",",
          "name": "punctuation.definition.parameters.grain"
        },
        { "include": "#comments" },
        { "include": "#type-destructor" }
      ]
    },
    "match": {
      "patterns": [
        {
          "begin": "(?=\\b(match)\\b\\s*\\(.*\\)\\s*\\{)",
          "end": "(?<=\\})",
          "patterns": [
            {
              "begin": "(\\{)",
              "end": "(\\})",
              "beginCaptures": {
                "1": { "name": "punctuation.definition.parameters.begin.grain" }
              },
              "endCaptures": {
                "1": { "name": "punctuation.definition.parameters.end.grain" }
              },
              "patterns": [
                {
                  "include": "#pattern-variant"
                }
              ]
            },
            {
              "begin": "\\b(match)\\b\\s*(\\()",
              "end": "(\\))",
              "beginCaptures": {
                "1": { "name": "keyword.control.grain" },
                "2": { "name": "punctuation.definition.parameters.begin.grain" }
              },
              "endCaptures": {
                "1": { "name": "punctuation.definition.parameters.end.grain" }
              },
              "patterns": [
                {
                  "include": "#expressions"
                }
              ]
            }
          ]
        },
        {
          "match": "\\b(match)\\b\\s*(?=\\()",
          "captures": {
            "1": { "name": "keyword.control.grain" }
          }
        }
      ]
    },
    "pattern": {
      "patterns": [
        {
          "begin": "\\b(pattern)\\b\\s*(?=\\{)",
          "end": "(?<=\\})",
          "beginCaptures": {
            "1": { "name": "keyword.operator.grain" }
          },
          "patterns": [
            {
              "begin": "(?<=\\||\\{)",
              "end": "(?=\\||\\})",
              "patterns": [
                {
                  "include": "#pattern-variant"
                }
              ]
            },
            {
              "match": "\\{",
              "name": "punctuation.definition.parameters.begin.grain"
            },
            {
              "match": "\\}",
              "name": "punctuation.definition.parameters.end.grain"
            }
          ]
        }
      ]
    }
  },
  "scopeName": "source.grain"
}
