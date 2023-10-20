import { Router, Request, Response } from 'express';
import { EventController } from '../controller/event';


const basic_routers = Router();
const event = new EventController();
basic_routers.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
  });

basic_routers.post("/add_event", event.addEvent)
basic_routers.get("/list_by_date/:date", event.getAllEventsByDate)
basic_routers.delete("/remove_by_id/:eventId", event.removeEventById)
  
export {basic_routers}  