import { Controller, Get, Param, Res, Post, Body } from '@nestjs/common';
import type { Response } from 'express';
import { DataCommonsService } from './dataCommons.service';

@Controller('data-commons')
export class DataCommonsController {
  constructor(private readonly service: DataCommonsService) {}

  @Get('structure')
  getFullStructure() {
    return this.service.getFullStructure();
  }

  @Get('project/:group/:program/:project/file-status')
  getProjectFilesStatus(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
  ) {
    return this.service.getProjectFilesStatus(group, program, project);
  }

  @Get('project/:group/:program/:project/description')
  async getProjectDescription(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Res() res: Response,
  ) {
    return this.service.sendProjectDescription(group, program, project, res);
  }

  @Get('project/:group/:program/:project/files/:filename')
  async getProjectFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.sendProjectFile(group, program, project, filename, res);
  }

  @Get('project/:group/:program/:project/deFile/:filename')
  async getDeFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.sendDeFile(group, program, project, filename, res);
  }

  @Get('project/:group/:program/:project/files/keys/:fileKey')
  async getProjectFileByKey(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('fileKey') fileKey: string,
    @Res() res: Response,
  ) {
    return this.service.sendProjectFileByKey(group, program, project, fileKey, res);
  }

  @Get('project/:group/:program/:project/preview/:filename')
  async previewProjectFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.previewProjectFile(group, program, project, filename, res);
  }

  @Post('project/:group/:program/:project/password')
  async checkProjectPassword(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Body() body: { password: string },
    @Res() res: any,
  ) {
    return this.service.checkProjectPassword(group, program, project, body.password || '', res);
  }
}
