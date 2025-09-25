FROM python:3.12.5-alpine

ARG TR_ARTIFACTORY_USERNAME
ARG TR_ARTIFACTORY_PASSWORD

WORKDIR /workspace

COPY ./ /workspace/

RUN apk add --no-cache git

RUN apk add --no-cache gcc musl-dev libffi-dev cargo \
    && pip3 install --upgrade pip \
    && pip install poetry==1.8.0 \
    && poetry config virtualenvs.create false

RUN poetry config http-basic.tr $TR_ARTIFACTORY_USERNAME $TR_ARTIFACTORY_PASSWORD

RUN poetry install --no-interaction --only=main

CMD exec uvicorn --app-dir=. src.main:create_app --host 0.0.0.0 --port 8080
