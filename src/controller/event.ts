import { eventModel } from "../model/Event";


class EventController{

    async addEvent(request: Request, response: Response){
        const eventReceived = request.body;

        if(!eventReceived){
            return response.status(403).json({error:true, message:"Nenhum evento recebido !"});
            
        }
        try {
            await new eventModel(eventReceived).save();
            response.status(201).json({
              error: false,
              message: 'Evento Adicionado !',
            });
        } catch (error) {
            console.log(error);
            response.status(406).json({
            error: true,
            message: 'Não foi possível adicionar o evento, tente novamente !',
            });
            
        }
    }
    //receive date on format YY-MM 
    async getAllEventsByDate(request:Request,response:Response){
        const {date} = request.params
            try {
              const eventsPerMonth = await eventModel.find({date: {$regex: date} });
              return response
                .status(201)
                .json({ error: false, message: 'Sucesso', events: eventsPerMonth });
            } catch (error) {
              console.log(error);
              return response.status(406).json({
                error: true,
                message:
                  'Não foi possível retornar os eventos dessa data, tente novamente',
              });
            }
        
    }

    async removeEventById(request:Request,response:Response){
      const {eventId } = request.params

      const eventAlreadyExist = await eventModel.find({ _id: eventId });

      if (eventAlreadyExist) {
        try {
          await eventModel.deleteOne({ _id: eventId });
          response
            .status(201)
            .json({ error: false, message: 'Apagado com sucesso !' });
        } catch (e) {
          response.status(406).json({
            error: true,
            message: 'Não foi possível apagar esse evento, tente novamente !',
          });
        }
      } else {
        response
          .status(406)
          .json({ error: true, message: 'Este evento não está cadastrado !' });
      }
    }
    
}

export {EventController}