import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppErrorFilter } from './utils/errors/errors.filter';
import { ResponseInterceptor } from './utils/response.interceptor';
import { customCss } from './utils/cssDocs';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

  app.use((req, res, next) => {
    if (req.path.includes('/mensagem/receber') || req.path.includes('/mensagem/resposta')) {
      req.setTimeout(30000);
      res.setTimeout(30000);
    } else {
      req.setTimeout(15000);
      res.setTimeout(15000);
    }
    next();
  });

  // PERMITIR USO DE INJECAO DE DEP. DENTRO DE VALIDATORS
  // useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // CONFIGURAÇÃO DO SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Documentação da API')
    .setVersion('0.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Usuario')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  app.use(
    '/docs',
    apiReference({
      theme: 'purple',
      darkMode: false,
      hideModels: true,
      hideDownloadButton: true,
      spec: {
        content: document,
      },
      customCss: customCss,
    }),
  );

  app.use('/health', (req, res) => {
    res.status(200).send({
      status: 'OK',
      message: 'Health check',
    });
  });
  
  // VALIDAÇÃO DE DADOS
  // Entrada
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );
  // Saída
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'exposeAll',
      enableImplicitConversion: true,
    }),
  );

  // TRATANDO AS RESPOSTAS DA APLICAÇÃO
  // INTERCEPTOR DE RESPOSTAS PARA PADRONIZAÇÃO
  app.useGlobalInterceptors(new ResponseInterceptor());
  // FILTRO DE ERROS
  app.useGlobalFilters(new AppErrorFilter());

  app.enableShutdownHooks();

  // CORS
  app.enableCors({
    origin: true, //Definir especificamente quais endpoints podem acessar o backend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, api-key',
    credentials: true,
  });

  // HABILITA PORTA E INICIA A APLICAÇÃO
  const porta = process.env.PORT || 3003;
  await app.listen(porta);
  console.log(`Aplicação executando na porta ${porta}`);
}
bootstrap();
