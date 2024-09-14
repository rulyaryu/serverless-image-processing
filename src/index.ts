import {Readable} from 'stream';
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import type {YC} from "./yc";
import * as sharp from 'sharp'

const client = new S3Client({
    region: 'ru-central1',
    endpoint: process.env.S3_ENDPOINT,
    // s3ForcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function putToS3(fullPath, body) {

    // console.log('CONNECTED');

    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: fullPath,
        Body: body,
        ContentType: 'image',
    });


    try {
         await client.send(command);
        // console.log(response);
    } catch (err) {
        // console.error('upload error', err);
    }
}

function handle({config, sharpStream}) {
    let fit = sharp.fit.cover;

    if (config.fit) {
        fit = config.fit;
    }

    return sharpStream
        .clone()
        .resize({
            width: config.width,
            height: config.height,
            fit: fit,
        })
        .toFormat('webp', {quality: 90})
        .toBuffer();
}

export async function handler(event: YC.CloudFunctionsHttpEvent) {

    process.setMaxListeners(10);

    const {config, path, name} = JSON.parse(event.body)

    const originalFilePath = [
        process.env.PREFIX, path, name
    ].join('/')

    try {
        const params = {
            Bucket: process.env.BUCKET,
            Key: originalFilePath,
        };

        new GetObjectCommand(params)

        var response = await client.send(new GetObjectCommand(params));
        var stream = response.Body;

// Convert stream to buffer to pass to sharp resize function.
        if (stream instanceof Readable) {
            var content_buffer = Buffer.concat(await stream.toArray());

        } else {
            throw new Error('Unknown object stream type');
        }


    } catch (error) {
        console.log(error);
        return;
    }


    const sharpStream = sharp(content_buffer);

    const promises = Object.keys(config).map((key) => {

        const thumbPath = path + '/thumbnails/' + key + '/' + name;
        const fullPath = [process.env.PREFIX, thumbPath]
            .join('/')
            .replace('.jpg', '.webp');

        return handle({
            config: config[key],
            sharpStream: sharpStream.clone()
        }).then(data => {
            return putToS3(fullPath, data);
        });

    })


    await Promise.all(promises)
        .then(res => {
            return {success: true}
        })
        .catch(err => {
            return {success: false, message: err}
        });

}
