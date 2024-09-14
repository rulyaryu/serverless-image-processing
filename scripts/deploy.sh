#!/bin/sh
source .env
#yc serverless function update --name=$FUNCTION_NAME
if [[ ! -e "build" ]]; then
    mkdir "build"
fi

cp package.json ./build/package.json
npx tsc --build tsconfig.json
cp src/*.js ./build

#export FUNCTION_ID=`yc serverless function get --name=$FUNCTION_NAME --format json | jq -r '.id'`
#AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY AWS_BUCKET=$AWS_BUCKET BUCKET=$BUCKET PREFIX=$PREFIX node scripts/setup.js
#
#yc serverless function version create \
#  --function-name=$FUNCTION_NAME \
#  --runtime nodejs12 \
#  --entrypoint index.handler \
#  --memory 256m \
#  --execution-timeout 10s \
#  --source-path ./build\
#  --environment AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY,AWS_BUCKET=$AWS_BUCKET,PREFIX=$PREFIX,BUCKET=$BUCKET
#
#
