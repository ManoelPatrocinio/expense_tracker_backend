import express, { Request, Response, Router } from 'express';
import { eventModel } from '../model/Event';
import { Event_type } from '../types/event';


const basic_routers = Router();

basic_routers.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});



basic_routers.post("/add_event", async (request: Request, response: Response) => {
  const eventReceived = request.body;

  if (!eventReceived) {
    return response.json({ error: true, monthsage: "Nenhum evento recebido !" });

  }
  try {
    await new eventModel(eventReceived).save();
    response.status(201).json({
      error: false,
      monthsage: 'Evento Adicionado !',
    });
  } catch (error) {
    console.log(error);
    response.json({
      error: true,
      monthsage: 'Não foi possível adicionar o evento, tente novamente !',
    });

  }
})
basic_routers.get("/list_by_date/:date", async (request: Request, response: Response) => {
  const { date } = request.params
  try {
    const eventsPerMonth = await eventModel.find({ date: { $regex: date } });
    return response
      .status(201)
      .json({ error: false, monthsage: 'Sucesso', events: eventsPerMonth });
  } catch (error) {
    console.log(error);
    return response.json({
      error: true,
      monthsage:
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
        .json({ error: false, monthsage: 'Apagado com sucesso !' });
    } catch (e) {
      response.json({
        error: true,
        monthsage: 'Não foi possível apagar esse evento, tente novamente !',
      });
    }
  } else {
    response
      .status(406)
      .json({ error: true, monthsage: 'Este evento não está cadastrado !' });
  }
})

basic_routers.get("/balance_by_category/:date", async (request: Request, response: Response) => {
  const { date } = request.params
  try {
    const eventsPerMonth = await eventModel.find({ date: { $regex: date } });

    const eventsPerCategory = eventsPerMonth.reduce((accumulator: Event_type[], cur) => {
      // guarda o nome atual e verifica se existe repetido
      let category = cur.category;
      let repetido = accumulator.find(elem => elem.category === category)
      // se for repetido soma, caso contrário adiciona o elemento ao novo array
      if (repetido) repetido.value += cur.value;
      else accumulator.push(cur);
      // retorna o elemento agrupado e somado
      return accumulator;
    }, []);
    console.log("eventsPerMonth: ", eventsPerMonth)
    return response
      .status(201)
      .json({ error: false, monthsage: 'Sucesso', balanceCategory: eventsPerCategory });
  } catch (error) {
    console.log(error);
    return response.json({
      error: true,
      monthsage:
        'Não foi possível retornar os eventos dessa data, tente novamente',
    });
  }

})


basic_routers.get("/balance_by_year/:year", async (request: Request, response: Response) => {
  const { year } = request.params
  const result = [];

  // Iterar por cada mês do ano
  for (let month = 1; month <= 12; month++) {
    const firtDaymonth = new Date(parseInt(year), month - 1, 1);
    const lastDiamonth = new Date(parseInt(year), month, 0);

    try {
      const totalPermonth = await eventModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: firtDaymonth,
              $lt: lastDiamonth
            },
            category: { $nin: ['income', 'investment'] } // Não incluir 'income' e 'investment'
          }
        },
        {
          $group: {
            _id: null,
            totalGasto: { $sum: '$value' }
          }
        }
      ]);

      const total = totalPermonth.length > 0 ? totalPermonth[0].totalGasto : 0;

      result.push({
        month,
        total
      });

    } catch (err) {
      console.error('Erro ao calcular total gasto por mês:', err);
    }

  }
  return response
  .status(201)
  .json({ error: false, monthsage: 'Sucesso', yearResult: result });
})
export { basic_routers }

