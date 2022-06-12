import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TaskItem } from '../models/TaskItem'
import { TaskUpdate } from '../models/TaskUpdate';

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TasksAccess')
// TODO: Implement the dataLayer logic
export  class TasksAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly tasksTable = process.env.TASKS_TABLE,
        private readonly indexName = process.env.TASKS_CREATED_AT_INDEX,
        private readonly tasksStorage = process.env.ATTACHMENT_S3_BUCKET
    ) {}
    
    // get all tasks items of current user
    async getAllTaskItems(userId) {        
        const result = await this.docClient.query({
            TableName: this.tasksTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
  
        return result.Items;
    }

    // get task items
    async getTaskItem(taskId, userId) {
        const result = await this.docClient.get({
            TableName: this.tasksStorage,
            Key: {
                taskId,
                userId
            }
        }).promise();  
        return result.Item;
    }

    // add task item
    async addTaskItem(taskItem:TaskItem) {
        await this.docClient.put({
            TableName: this.tasksTable,
            Item: taskItem
        }).promise();
    }

    // update task item
    async updateTaskItem(taskId, userId, updatedTask:TaskUpdate) {
        console.log("update taskId:" +taskId+ " " +userId)
        logger.info("update taskId:" +taskId+ " " +userId)
          await this.docClient.update({
              TableName: this.tasksTable,
              Key: {
                taskId,
                  userId
              },
              UpdateExpression: 'set #name = :n, #dueDate = :due, #done = :d',
              ExpressionAttributeValues: {
                  ':n': updatedTask.name,
                  ':due': updatedTask.dueDate,
                  ':d': updatedTask.done
              },
              ExpressionAttributeNames: {
                  '#name': 'name',
                  '#dueDate': 'dueDate',
                  '#done': 'done'
              }
          }).promise();
      }

      // delete task item
      async deleteTaskItem(taskId, userId) {
        await this.docClient.delete({
            TableName: this.tasksTable,
            Key: {
                taskId,
                userId
            }
        }).promise();
    }

    // update attachment Url
    async updateTaskAttachmentUrl(taskId: string, attachmentUrl: string){
        console.log('updateTaskAttachmentUrl' + taskId +" "+ attachmentUrl)
        logger.info('updateTaskAttachmentUrl' + taskId +" "+ attachmentUrl)
        await this.docClient.update({
            TableName: this.tasksTable,
            Key: {
                "taskId": taskId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": `https://${this.tasksStorage}.s3.amazonaws.com/${attachmentUrl}`
            }
        }).promise();
    }    
}