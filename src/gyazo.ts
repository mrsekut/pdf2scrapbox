import request from "request";
import * as dotenv from 'dotenv';
dotenv.config();

type Query = {
  access_token: string;
  image_id: string;
}

export const image = (query: Query) => {
  return new Promise((resolve, reject) => {
    query.access_token = process.env['GYAZO_TOKEN'] as string;
    const url = "https://api.gyazo.com/api/images/" + query.image_id;
    request.get(
      {
        url: url,
        qs: query,
      },
      (err, res) => {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(res.body);
        resolve({
          response: res,
          data: JSON.parse(res.body),
        });
      }
    );
  });
}
