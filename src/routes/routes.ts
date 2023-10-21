import express, { Request, Response, Router } from 'express';
import { eventModel } from '../model/Event';


const basic_routers = Router();

basic_routers.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});



basic_routers.post("/add_event", async (request: Request, response: Response) => {
  const eventReceived = request.body;

  if (!eventReceived) {
    return response.json({ error: true, message: "Nenhum evento recebido !" });

  }
  try {
    await new eventModel(eventReceived).save();
    response.status(201).json({
      error: false,
      message: 'Evento Adicionado !',
    });
  } catch (error) {
    console.log(error);
    response.json({
      error: true,
      message: 'Não foi possível adicionar o evento, tente novamente !',
    });

  }
})
basic_routers.get("/list_by_date/:date", async (request: Request, response: Response) => {
  const { date } = request.params
  try {
    const eventsPerMonth = await eventModel.find({ date: { $regex: date } });
    return response
      .status(201)
      .json({ error: false, message: 'Sucesso', events: eventsPerMonth });
  } catch (error) {
    console.log(error);
    return response.json({
      error: true,
      message:
        'Não foi possível retornar os eventos dessa data, tente novamente',
    });
  }

})
basic_routers.delete("/remove_by_id/:eventId", async (request: Request, response: Response) => {
  const { eventId } = request.params

  const eventAlreadyExist = await eventModel.find({ _id: eventId });

  if (eventAlreadyExist) {
    try {
      await eventModel.deleteOne({ _id: eventId });
      response
        .status(201)
        .json({ error: false, message: 'Apagado com sucesso !' });
    } catch (e) {
      response.json({
        error: true,
        message: 'Não foi possível apagar esse evento, tente novamente !',
      });
    }
  } else {
    response
      .status(406)
      .json({ error: true, message: 'Este evento não está cadastrado !' });
  }
})

export { basic_routers }  