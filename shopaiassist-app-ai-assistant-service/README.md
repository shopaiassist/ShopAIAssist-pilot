![Python support][python-support]

![Flake8 linting statistics][flake8] ![Black code formatting][black]

![Number of tests][num-tests] ![Test coverage][test-coverage]

![CI testing][ci-testing] ![Latest version published][latest-version-published]

# AI Assistane Service

> SHOPAIASSISTANT Assistance's API

## Installation

### Install from package index

<!-- TODO update when package publishing is configured -->

*This package is not yet published to a package index.*

[Learn how to publish this package](https://python.labs.SHOPAIASSISTcom/publishing/publish-your-package/)

### Install from source

Clone this repository. Then have `poetry` create a virtual environment and install all dependencies into it.

```
poetry install
```

## Running the app in local

### Virtual environment usage

Assuming you're using TR's standard `poetry`, you can activate and execute commands within the virtual environment anytime using `poetry run` or `poetry shell`.

```
$ poetry run uvicorn src.main:create_app --host 127.0.0.1 --port 5001 --reload
```

```
$ poetry shell
$ uvicorn src.main:create_app --host 127.0.0.1 --port 5001 --reload
```

Once you run the app, you can navigate to `http://127.0.0.1:5001/assisvc/docs` to access the swagger.

[Learn how to use `poetry`](https://python.labs.com/reference/#poetry)

### Library usage

<!-- TODO add poetry run, poetry shell -->

```
import ai_assistant_service
```

## Documentation

### Package documentation from source

[Install from source](#install-from-source). Then run the `host-local-package-docs` task.

```
poetry run poe host-local-package-docs
```

### Remotely deployed package documentation

<!-- TODO update when documentation is deployed remotely -->

*This package's documentation is not yet deployed remotely.*

[Learn how to deploy this package&#39;s documentation](https://python.labs.com/documentation/deploy-docs/#deploy-for-others)

## Resources

* [LICENSE](LICENSE.md)
* [CHANGELOG](CHANGELOG.md)
* [CONTRIBUTING](CONTRIBUTING.md)
* [DEVELOPERS](DEVELOPERS.md)

---

**This package was generated using the [Python Package Template](https://python.labs.com/)**

<!-- GitHub Badges (see top) -->
