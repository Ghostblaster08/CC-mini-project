/**
 * Test AWS Services Access
 * Checks which AWS services are available in Learner Lab
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AWS from 'aws-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION || 'us-east-1'
});

async function testAWSServices() {
  console.log('🔍 Testing AWS Services Access...\n');

  // Test 1: S3
  console.log('1️⃣ Testing S3 Access...');
  const s3 = new AWS.S3();
  try {
    await s3.listBuckets().promise();
    console.log('✅ S3: ListBuckets - Allowed\n');
  } catch (error) {
    console.log(`❌ S3: ListBuckets - Denied (${error.code})\n`);
  }

  // Test 2: DynamoDB
  console.log('2️⃣ Testing DynamoDB Access...');
  const dynamodb = new AWS.DynamoDB();
  try {
    const tables = await dynamodb.listTables().promise();
    console.log('✅ DynamoDB: ListTables - Allowed');
    console.log('   Tables:', tables.TableNames);
    console.log('');
  } catch (error) {
    console.log(`❌ DynamoDB: ListTables - Denied (${error.code})\n`);
  }

  // Test 3: DynamoDB - Create Table
  console.log('3️⃣ Testing DynamoDB Create Table...');
  try {
    const params = {
      TableName: 'AshrayTestTable',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };
    await dynamodb.createTable(params).promise();
    console.log('✅ DynamoDB: CreateTable - Allowed\n');
    
    // Clean up test table
    await dynamodb.deleteTable({ TableName: 'AshrayTestTable' }).promise();
  } catch (error) {
    console.log(`❌ DynamoDB: CreateTable - Denied (${error.code})\n`);
  }

  // Test 4: EC2
  console.log('4️⃣ Testing EC2 Access...');
  const ec2 = new AWS.EC2();
  try {
    const instances = await ec2.describeInstances().promise();
    console.log('✅ EC2: DescribeInstances - Allowed');
    console.log('   Instances:', instances.Reservations.length);
    console.log('');
  } catch (error) {
    console.log(`❌ EC2: DescribeInstances - Denied (${error.code})\n`);
  }

  // Test 5: CloudWatch
  console.log('5️⃣ Testing CloudWatch Access...');
  const cloudwatch = new AWS.CloudWatch();
  try {
    const metrics = await cloudwatch.listMetrics({ Limit: 1 }).promise();
    console.log('✅ CloudWatch: ListMetrics - Allowed\n');
  } catch (error) {
    console.log(`❌ CloudWatch: ListMetrics - Denied (${error.code})\n`);
  }

  // Test 6: SNS
  console.log('6️⃣ Testing SNS Access...');
  const sns = new AWS.SNS();
  try {
    const topics = await sns.listTopics().promise();
    console.log('✅ SNS: ListTopics - Allowed');
    console.log('   Topics:', topics.Topics.length);
    console.log('');
  } catch (error) {
    console.log(`❌ SNS: ListTopics - Denied (${error.code})\n`);
  }

  // Test 7: SQS
  console.log('7️⃣ Testing SQS Access...');
  const sqs = new AWS.SQS();
  try {
    const queues = await sqs.listQueues().promise();
    console.log('✅ SQS: ListQueues - Allowed');
    console.log('   Queues:', queues.QueueUrls?.length || 0);
    console.log('');
  } catch (error) {
    console.log(`❌ SQS: ListQueues - Denied (${error.code})\n`);
  }

  console.log('✅ AWS Service Testing Complete!\n');
  console.log('📋 Summary:');
  console.log('   Use services marked with ✅ in your project');
  console.log('   MongoDB Atlas counts as cloud database service');
}

testAWSServices().catch(console.error);
