import 'source-map-support/register';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserId } from '../lambda/utils';
import { TasksAccess } from '../dataLayer/tasksAcess'
import { TasksStorage } from '../helpers/attachmentUtils';
import { TaskItem } from '../models/TaskItem'
import { CreateTaskRequest } from '../requests/CreateTaskRequest'
import { UpdateTaskRequest } from '../requests/UpdateTaskRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const taskAccess = new TasksAccess();
const tasksStorage = new TasksStorage();
const logger = createLogger('tasks');
// TODO: Implement businessLogic
// create task item
export async function createTaskItem(event: APIGatewayProxyEvent, createTaskRequest: CreateTaskRequest): Promise<TaskItem> {
    const taskId = uuid.v4();
    const userId = getUserId(event);
    const createdAt = new Date(Date.now()).toISOString();
    const bucketName = await tasksStorage.getBucketName();

    const taskItem = {
        userId,
        taskId,
        createdAt,
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${taskId}`,
        ...createTaskRequest
    };
    console.log('createTaskItem userId:' + userId + "taskId:"+taskId +"bucketname:" +bucketName )
    logger.info('createTaskItem userId:' + userId + "taskId:"+taskId +"bucketname:" +bucketName );
    await taskAccess.addTaskItem(taskItem);

    return taskItem;
}

// get task item by taskId
export async function getTaskItem(event: APIGatewayProxyEvent) {
    const taskId = event.pathParameters.taskId;
    const userId = getUserId(event);
    console.log('getTaskItem userId:' + userId + "taskId:"+taskId );
    return await taskAccess.getTaskItem(taskId, userId);
}

// get all task items by userId
export async function getTaskItems(event: APIGatewayProxyEvent) {
    const userId = getUserId(event);
    console.log('getTaskItems userId:' + userId)
    logger.info('getTaskItems userId:' + userId);
    return await taskAccess.getAllTaskItems(userId);
}

export async function updateTaskItem(event: APIGatewayProxyEvent,
    updateTaskRequest: UpdateTaskRequest) {
    const taskId = event.pathParameters.taskId;
    const userId = getUserId(event);
    logger.info('updateTaskItem userId:' + userId);

    if (!(await taskAccess.getTaskItem(taskId, userId))) {
        return false;
    }
    console.log('updateTaskItem userId:' + userId + "taskId:"+taskId );
    logger.info('updateTaskItem userId:' + userId + "taskId:"+taskId );    
    await taskAccess.updateTaskItem(taskId, userId, updateTaskRequest);
    return true;
}

export async function deleteTaskItem(event: APIGatewayProxyEvent) {
    const taskId = event.pathParameters.taskId;
    const userId = getUserId(event);

    if (!(await taskAccess.getTaskItem(taskId, userId))) {
        return false;
    }
    console.log('delete task  item by taskId:' + taskId + "userId:"+userId )
    await taskAccess.deleteTaskItem(taskId, userId);

    return true;
}

export async function generateUploadUrl(event: APIGatewayProxyEvent): Promise<string> {
    const bucket = await tasksStorage.getBucketName();
    const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
    const taskId = event.pathParameters.taskId;
    console.log('generateUploadUrl bucket:' + bucket + "taskId:"+taskId )
    return await tasksStorage.getPresignedUploadURL(bucket,taskId,urlExpiration);
}
