#!/bin/bash
cp "./env/$techopsRegion-$techopsEnvironment.env" .env

if [[  "$techopsRegion" == "us-east-1" ]] 
then
    sed -i s/{SUB_D}/gcp/g .env
    sed -i s/{REGION}/us/g .env
else
    sed -i s/{SUB_D}/uk/g .env
    sed -i s/{REGION}/uk/g .env
fi

if [[ "$techopsEnvironment" == "prod" ]] 
then
    sed -i s/{B_ENV}//g .env
    sed -i s/{STAGE}//g .env
    sed -i s/{C_ENV}/${techopsEnvironment}/g .env
elif [[ "$techopsEnvironment" == "uat" ]] 
then
    sed -i s/{B_ENV}/-onesource/g .env
    sed -i s/{STAGE}/-staging/g .env
    sed -i s/{C_ENV}/${techopsEnvironment}/g .env


elif [[ "$techopsEnvironment" == "dev" ]] 
then
    sed -i s/{B_ENV}//g .env
    sed -i s/{C_ENV}/qa/g .env
    sed -i s/{STAGE}/-staging/g .env
else
    sed -i s/{B_ENV}/-onesource-${techopsEnvironment}/g .env
    sed -i s/{C_ENV}/${techopsEnvironment}/g .env
    sed -i s/{STAGE}/-staging/g .env
fi

USER=$(aws secretsmanager get-secret-value --secret-id a208767-osia-atlas-mongodb-$techopsEnvironment --query SecretString --output text |  jq -r .username)
PASS=$(aws secretsmanager get-secret-value --secret-id a208767-osia-atlas-mongodb-$techopsEnvironment --query SecretString --output text |  jq -r .password)
HOST=$(aws secretsmanager get-secret-value --secret-id a208767-osia-atlas-mongodb-$techopsEnvironment --query SecretString --output text |  jq -r .domain)
AUTH=$(aws secretsmanager get-secret-value --secret-id a208767-osia-atlas-mongodb-$techopsEnvironment --query SecretString --output text |  jq -r .auth)

sed -i s/{DB_USER}/$USER/g .env
sed -i s/{DB_PASS}/$PASS/g .env
sed -i s/{DB_HOST}/$HOST/g .env
sed -i s/{AUTH}/$AUTH/g .env

npm run build
npm run start:prod
