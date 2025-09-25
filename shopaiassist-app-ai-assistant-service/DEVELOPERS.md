# Developing

*See [CONTRIBUTING](CONTRIBUTING.md) for how to contribute code if you are not already a primary developer of this repository.*

## Prerequisites

*You need...*

1. Python 3
2. `poetry`
3. Artifactory API key

[See further prerequisite guidance](https://python.labs.com/introduction/prerequisites/)

## Development installation

**Clone this repository.**

```
$ git clone https://github.com/tr/a208767_osia-app-ai-assistant-service.git
```

**Install the package and its dependencies into a virtual environment.** Poetry automatically creates a virtual environment and installs all depdendencies into it.

```
cd 208767_osia_app-ai-assistant-service
poetry install
```

A [.venv directory](https://python.labs.com/reference/#venv-directory) should now appear. This is where `poetry` installed your virtual environment.

**You can activate this virtual environment** anytime using either `poetry run` or `poetry shell`

```
poetry run python
```

```
poetry shell
python
```

**Install git hooks.** We use pre-commit checks to keep a variety of issues from making it into our shared codebases.

```
poetry run pre-commit install
```

You should now be able to execute the pre-commit check task. See *Coding standards* below.

[See further git hooks installation guidance](https://python.labs.com/introduction/install-git-hooks/)</br>

## Coding standards

**Use pre-commit checks** to enforce formatting, check for merge conflicts, private keys, proper docstrings, etc.

```
poetry run poe pre-commit-checks
```

[See further pre-commit check guidance](https://python.labs.com/introduction/install-git-hooks/)</br>
[See further `poe` task guidance](https://python.labs.com/reference/#poe)

**Also see other code standard configurations**...

- `.editorconfig` for general editor configuration.
- `.flake8` for coding style configurations.
- The `tool.black` section of `pyproject.toml` for further style configurations.
- `mypy.ini` for static type checking configuration.


## Configuring your IDE

[See further IDE configuration guidance](https://python.labs.com/introduction/configure-your-ide/)

Known Issues:

- If code coverage is enabled in pytest, it breaks the debugger
  - <https://youtrack.jetbrains.com/issue/PY-20186>
  - <https://github.com/pytest-dev/pytest-cov/issues/131>

## Testing

**Run all pre-commit checks and tests.**

```
poetry run poe test
```

**Or run just the tests.**

```
poetry run poe pytest
```

**NOTE**:

- Tests will fail if minimum coverage is not yet met.
- All tests are in the [`tests` directory](https://python.labs.com/reference/#tests-directory).
- All test reports are written to the [`reports` directory](https://python.labs.com/reference/#reports-directory).

[See further testing guidance](https://python.labs.com/testing/run-tests/)</br>
[See further `poe` task guidance](https://python.labs.com/reference/#poe)

## Documentation

**Build package documentation**.

```bash
poetry run poe build-package-docs
```

You can now view the package documentation by opening `208767_osia_app-ai-assistant-service/docs/ai_assistant_service/index.html` using your browser.

**Deploy package documentation locally**.

You can also host and review the package documentation on `localhost` (instead of manually pointing your browser to the build's `index.html` as suggested just above).

```bash
poetry run poe host-local-package-docs
```

[See further package documentation guidance](https://python.labs.com/documentation/build-package-docs/)</br>
[See further `poe` task guidance](https://python.labs.com/reference/#poe)

## Building and publishing

**Build package to wheel**

```
poetry run poe build-wheel
```

**You can also publish and/or release your package** using similar commands, if TR Artifactory has been setup to do so.

```
poetry run poe publish
```

```
poetry run poe release
```

[See further package publishing guidance](https://python.labs.com/publishing/publish-your-package/)</br>
[See further `poe` task guidance](https://python.labs.com/reference/#poe)

## Releases

**Releases should happen through our continuous integration ands deployment process (CI/CD).**
This project is preconfigured to use AWS CodeBuild. See `buildspec.yml`.

**Make sure to update the `CHANGELOG.md` whenever you cut a release.**

---

**This package was generated using the [Python Package Template](https://python.labs.com/)**
