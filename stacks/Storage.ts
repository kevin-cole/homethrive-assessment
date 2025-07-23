import { StackContext, Bucket } from 'sst/constructs'

export function Storage({ stack }: StackContext) {
  // Create an S3 bucket to store the database file
  const bucket = new Bucket(stack, 'homethrive-assessment-db')

  // Show the bucket name in the output
  stack.addOutputs({
    DatabaseBucketName: bucket.bucketName,
  })

  return {
    bucket,
  }
}
