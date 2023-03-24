## Genghis Khan Academy
### Database setup
After cloning the project and running `npm install`, set up your database. You should have Postgres running on your computer or on a server somewhere. Access the database and run:
```sql
CREATE DATABASE khan;
```
Now create a `.env` file in the project's root directory and add

```
DATABASE_URL="postgresql://<user>:<password>@<domain>:<port>/khan"
```
Replace the parts in the <> with your DB connection info.

Now, from the root directory run `npx prisma migrate dev --name` to set up your database tables.

### Environment variables

Create a `.env.local` file and add the line
```
SECRET_COOKIE_PASSWORD="reallyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyylongpassword"
```
where the value is a password of at least 32 characters.

If you plan to work on the admin features, go to [tiny.cloud](tiny.cloud) and create a free account. Under your account page's Cloud Dashboard, scroll to the bottom and copy your Tiny API Key. Add this key to your `.env.local`:

```
NEXT_PUBLIC_TINY_API_KEY=<your_key_here>
```

At this point you should be ready to run `npm run dev` and fire up your local server. 

### Storing images
If you want to store and serve images in your development environment, set up an AWS S3 bucket. 

#### The Permissions

First, in the AWS console, navigate to the IAM page, the Users tab, and click Add Users. Name the user whatever you want then, under the Permissions page, select "Attach policies directly," search for "AmazonS3FullAccess" and select it.

Now click the Create Policy button, select the JSON tab, and copy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "STSToken",
            "Effect": "Allow",
            "Action": "sts:GetFederationToken",
            "Resource": [
                "arn:aws:sts::<YOUR_ID_HERE>:federated-user/S3UploadWebToken"
            ]
        }
    ]
}
```
into the editor, replacing YOUR_ID_HERE with your AWS ID which can be found by clicking on your name in the top right corner (do not include the hyphens).

Continue on and give the policy a name, then create it. Close the tab and you'll be back at the user you were making. Refresh the policies list and search for the name you just created. Add it and move on, finishing creating the user.

Now go to the user's Security Credentials tab. Under "Access Keys" click "Create access key". Choose "Application running outside AWS", then move and create the key. *DON'T LEAVE THE NEXT PAGE UNTIL YOU'VE COPIED THE VALUES!*

In your `.env.local` file add the lines:

```
S3_UPLOAD_KEY=<key_name>
S3_UPLOAD_SECRET=<secret_key>
```
pasting as values the credentials you just created. 

#### The Bucket
Go to S3 now. Create a bucket and call it whatever you want, keeping the default settings. 

In your `.env.local` file copy:

```
S3_UPLOAD_BUCKET=<your_bucket_name>
S3_UPLOAD_REGION=us-east-1
```

Now go to the CloudFront console and click Create Distribution. 

1. Under the Origin Domain select the bucket you just created. 
2. Under Origin Access select "Origin Access Control Settings"
3. Press "Create Control Setting", leave the defaults, and create.
4. Leave everything else default and then create.
5. You should get a link to update the S3 bucket policy. Copy the JSON that's provided to you and paste it into the bucket policy for your bucket.
6. Go to your CloudFront distribution and copy the distribution domain name.

Paste the domain name in `.env.local`:
```
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://your_id.cloudfront.net
```

In `next.config.ts`, under `images.domains`, replace the existing domain with your CloudFront domain (don't include the `http://`!) and restart your dev server if it's running.

That wasn't so bad, was it? You're now ready to save images!