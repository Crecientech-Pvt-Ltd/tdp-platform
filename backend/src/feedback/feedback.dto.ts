import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  feedback: string;
}

export class UpdateFeedbackStatusDto {
  @IsNotEmpty()
  @IsString()
  status: 'pending' | 'taken';
}
