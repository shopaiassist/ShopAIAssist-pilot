.. highlight:: shell

<!-- Oftentimes open source projects place a CONTRIBUTING file in the root directory. It explains how a participant should do things like format code, test fixes, and submit patches -->

# Contributing

*See [DEVELOPERS](DEVELOPERS.md) for lower level technical instructions for how to contribute to this package.*

Contributions are welcome, and they are greatly appreciated! Every
little bit helps, and credit will always be given.

You can contribute in many ways:

## Types of Contributions

### Report Bugs

Report bugs at https://github.com/tr/208767_osia_app-ai-assistant-service/issues

If you are reporting a bug, please include:

-   Your operating system name and version.
-   Any details about your local setup that might be helpful in
    troubleshooting.
-   Detailed steps to reproduce the bug.

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with "bug" and
"help wanted" is open to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with
"enhancement" and "help wanted" is open to whoever wants to implement
it.

### Write Documentation

AI Assistant Service could always use more documentation,
whether as part of the official AI Assistant Service docs,
in docstrings, or even even blog posts, articles, and such.

### Submit Feedback

The best way to send feedback is to file an issue at https://github.com/tr/208767_osia_app-ai-assistant-service/issues.

If you are proposing a feature:

-   Explain in detail how it would work.
-   Keep the scope as narrow as possible, to make it easier to
    implement.
-   Remember that this is a volunteer-driven project, and that
    contributions are welcome :)

## Get Started!

Ready to contribute? Here's how to set up
`ai_assistant_service` for local development.

1.  Clone this repository:

```
$ git clone https://github.com/tr/a208767_osia-app-ai-assistant-service.git
```

2.  Install your local copy into a virtual environment.

```
$ cd 208767_osia_app-ai-assistant-service
$ poetry install
```

3.  Create a branch for local development::

```
$ git checkout -b name-of-your-bugfix-or-feature
```

Now you can make your changes locally.

4.  When you're done making changes, check that your changes passes the pre-commit checks and tests.

```
$ poetry run poe test
```

5.  Commit your changes and push your branch to GitHub::

**NOTE:** You will need at least write permissions to push your branch upstream. Please contact repository admins if you don't yet have these permissions.

```
$ git add .
$ git commit -m "Your detailed description of your changes."
# You will need at least write access to push your branch upstream
$ git push -u origin name-of-your-bugfix-or-feature
```

6.  Submit a pull request through the GitHub website.

Now that you've pushed a new branch, you should see an option to open a pull-request when you visit [the repository on GitHub](https://github.com/tr/a208767_osia-app-ai-assistant-service). Follow the prompts.

## Pull Request Guidelines

Before you submit a pull request, check that it meets these guidelines:

1.  The pull request should include tests.
2.  If the pull request adds functionality, the docs should be updated.
    Put your new functionality into a function with a docstring.

## Tips

- [See package testing guidance here](https://python.labs.thomsonreuters.com/testing/run-tests/)
- [See package documentation guidance here](https://python.labs.thomsonreuters.com/documentation/build-package-docs/)
- [See package publishing guidance here](https://python.labs.thomsonreuters.com/publishing/build-your-package/)

---

**This package was generated using the [Python Package Template](https://python.labs.thomsonreuters.com/)**
