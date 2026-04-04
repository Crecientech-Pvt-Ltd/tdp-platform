import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DataCommonsService } from './dataCommons.service';

@Controller('data-commons')
export class DataCommonsController {
  constructor(private readonly service: DataCommonsService) {}

  @Get('structure')
  getFullStructure(@Query('dataCommonsPath') dataCommonsPath?: string) {
    return this.service.getFullStructure(dataCommonsPath);
  }

  @Get('project/:group/:program/:project/description')
  async getProjectDescription(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.sendProjectDescription(group, program, project, res, dataCommonsPath);
  }

  @Get('project/:group/:program/:project/files/:filename')
  async getProjectFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.sendProjectFile(group, program, project, filename, res, dataCommonsPath);
  }

  @Get('project/:group/:program/:project/deFile/:filename')
  async getDeFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.sendDeFile(group, program, project, filename, res, dataCommonsPath);
  }

  @Get('project/:group/:program/:project/initializedFiles')
  async getInitializedFiles(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.initializedFiles(group, program, project, res, dataCommonsPath);
  }

  @Get('project/:group/:program/:project/preview/:filename')
  async previewProjectFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.previewProjectFile(group, program, project, filename, res, dataCommonsPath);
  }

  @Post('project/:group/:program/:project/password')
  async checkProjectPassword(
    @Req() req: Request,
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Body() body: { password: string },
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.checkProjectPassword(req, group, program, project, body.password || '', res, dataCommonsPath);
  }

  @Get('project/:group/:program/:project/verify-auth')
  async verifyProjectAuthorization(
    @Req() req: Request,
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Query('dataCommonsPath') dataCommonsPath: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.verifyAuth(req, group, program, project, res, dataCommonsPath);
  }
}
