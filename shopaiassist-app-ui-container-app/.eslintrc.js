module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "ignorePatterns": ['dist', 'node_modules', 'storybook-static'],
  "overrides": [
    {
      "env": {
        "node": true
      },
      "files": [
        ".eslintrc.{js,cjs}"
      ],
      "parserOptions": {
        "sourceType": "script"
      }
    },
    // no global console for server side logs, prefer LOG utility
    {
      "files": ["./server/**"],
      "rules": {
        "no-console": "off"
      }
    },
    {
      "files": ["**/*.js", "**/*.ts", "**/*.tsx"],
      "rules": {
        "simple-import-sort/imports": [
          "error",
          {
            "groups": [
              // Subgroups will get a blank line added in-between
              [
                // `react` first
                "^react$",
                // Side effect imports.
                "^\\u0000",
                // Node.js builtins prefixed with `node:`.
                "^node:",
                // Packages.
                // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
                "^@?\\w",
              ],
              [
                // Parent imports. Put `..` last.
                "^\\.\\.(?!/?$)", "^\\.\\./?$",
                // Other relative imports. Put same-folder imports and `.` last.
                "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"
              ],
              [
                // JSON imports.
                "^.+\\.json$",
                // Style imports.
                "^.+\\.s?css$"
              ]
            ]
          }
        ]
      }
    }
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "use-encapsulation",
    "prefer-arrow",
    "simple-import-sort",
    "import"
  ],
  "rules": {    
    "use-encapsulation/prefer-custom-hooks": "off",
    "prefer-arrow/prefer-arrow-functions": [
      "error",
      {
        "disallowPrototype": true,
        "singleReturnOnly": false,
        "classPropertiesAllowed": false
      }
    ],
    "simple-import-sort/imports": "off",
    "simple-import-sort/exports": "error",
    "import/newline-after-import": "off",
    "import/no-duplicates": "error"
  }
}
